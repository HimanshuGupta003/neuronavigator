import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const adminClient = await createAdminClient();

        // Verify the user is authenticated and is an admin
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check if user is admin
        const { data: profile } = await adminClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Only administrators can invite workers' },
                { status: 403 }
            );
        }

        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { success: false, error: 'Email is required' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const { data: existingProfile } = await adminClient
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

        if (existingProfile) {
            return NextResponse.json(
                { success: false, error: 'A user with this email already exists' },
                { status: 400 }
            );
        }

        // Check for existing pending invitation
        const { data: existingInvitation } = await adminClient
            .from('invitations')
            .select('id')
            .eq('email', email)
            .is('used_at', null)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (existingInvitation) {
            return NextResponse.json(
                { success: false, error: 'A pending invitation already exists for this email' },
                { status: 400 }
            );
        }

        // Generate secure token for our invitation tracking
        const token = crypto.randomBytes(32).toString('hex');

        // Set expiration to 7 days from now
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Create invitation record in our database
        const { error: insertError } = await adminClient
            .from('invitations')
            .insert({
                email,
                token,
                invited_by: user.id,
                expires_at: expiresAt.toISOString(),
            });

        if (insertError) {
            console.error('Insert error:', insertError);
            return NextResponse.json(
                { success: false, error: 'Failed to create invitation' },
                { status: 500 }
            );
        }

        // Generate invitation link
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const invitationLink = `${appUrl}/setup-credentials?token=${token}`;

        // Use Supabase's built-in invite functionality
        let emailSent = false;
        try {
            // Try to send invitation via Supabase Auth
            const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
                redirectTo: invitationLink,
                data: {
                    role: 'worker',
                    invited_by: user.id,
                }
            });

            if (inviteError) {
                console.error('Supabase invite error:', inviteError);
                // If Supabase invite fails (e.g., rate limit), we still have the manual link
                emailSent = false;
            } else {
                console.log('Supabase invitation sent:', inviteData);
                emailSent = true;
            }
        } catch (inviteErr) {
            console.error('Supabase invite exception:', inviteErr);
            emailSent = false;
        }

        return NextResponse.json({
            success: true,
            data: {
                invitationLink,
                emailSent,
                message: emailSent
                    ? 'Invitation email sent successfully via Supabase!'
                    : 'Invitation created. Please share the link manually (email rate limit may have been reached).'
            },
        });

    } catch (error) {
        console.error('Invite error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
