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

        const { email, name } = await request.json();

        if (!email) {
            return NextResponse.json(
                { success: false, error: 'Email is required' },
                { status: 400 }
            );
        }

        // Check if user already has a complete profile (already fully set up)
        const { data: existingProfile } = await adminClient
            .from('profiles')
            .select('id, full_name')
            .eq('email', email)
            .single();

        if (existingProfile && existingProfile.full_name) {
            return NextResponse.json(
                { success: false, error: 'This worker already has a complete account' },
                { status: 400 }
            );
        }

        // Generate secure token for our invitation tracking
        const token = crypto.randomBytes(32).toString('hex');

        // Set expiration to 7 days from now
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Check for existing pending invitation and update or create
        const { data: existingInvitation } = await adminClient
            .from('invitations')
            .select('id')
            .eq('email', email)
            .is('used_at', null)
            .single();

        if (existingInvitation) {
            // Update existing invitation with new token and expiry
            await adminClient
                .from('invitations')
                .update({
                    token,
                    expires_at: expiresAt.toISOString(),
                    invited_name: name || null,
                })
                .eq('id', existingInvitation.id);
        } else {
            // Create new invitation record
            const { error: insertError } = await adminClient
                .from('invitations')
                .insert({
                    email,
                    token,
                    invited_by: user.id,
                    expires_at: expiresAt.toISOString(),
                    invited_name: name || null,
                });

            if (insertError) {
                console.error('Insert error:', insertError);
                return NextResponse.json(
                    { success: false, error: 'Failed to create invitation' },
                    { status: 500 }
                );
            }
        }

        // Generate invitation link - redirect to callback which will handle the flow
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const invitationLink = `${appUrl}/setup-credentials?token=${token}`;
        const supabaseRedirectUrl = `${appUrl}/callback`;

        // Check if user already exists in Supabase Auth
        const { data: existingUsers } = await adminClient.auth.admin.listUsers();
        const existingAuthUser = existingUsers?.users?.find(u => u.email === email);

        let emailSent = false;
        let emailError: string | null = null;

        if (existingAuthUser) {
            // User exists in auth - delete and recreate to send fresh invite
            console.log('User exists, deleting and re-inviting...');

            // Delete existing auth user (they haven't set up yet)
            await adminClient.auth.admin.deleteUser(existingAuthUser.id);

            // Now send fresh invite
            const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
                redirectTo: supabaseRedirectUrl,
                data: {
                    role: 'worker',
                    invited_by: user.id,
                }
            });

            if (inviteError) {
                console.error('Supabase invite error:', inviteError);
                emailError = inviteError.message;
            } else {
                console.log('Invite sent successfully:', inviteData);
                emailSent = true;
            }
        } else {
            // New user - send invite email via Supabase
            console.log('New user, sending invite email...');
            const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
                redirectTo: supabaseRedirectUrl,
                data: {
                    role: 'worker',
                    invited_by: user.id,
                }
            });

            if (inviteError) {
                console.error('Supabase invite error:', inviteError);
                emailError = inviteError.message;
            } else {
                console.log('Invite sent successfully:', inviteData);
                emailSent = true;
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                invitationLink,
                emailSent,
                message: emailSent
                    ? 'Invitation email sent successfully via Supabase!'
                    : 'Invitation created. Share the link manually if email was not received.'
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
