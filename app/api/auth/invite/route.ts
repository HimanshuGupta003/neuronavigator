import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const adminSupabase = await createAdminClient();

        // Check if requester is authenticated and is admin
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Only administrators can send invitations' },
                { status: 403 }
            );
        }

        // Get invitation details from request
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { success: false, error: 'Email is required' },
                { status: 400 }
            );
        }

        // Check if email is already registered
        const { data: existingUser } = await adminSupabase.auth.admin.listUsers();
        const userExists = existingUser?.users?.some(u => u.email === email);

        if (userExists) {
            return NextResponse.json(
                { success: false, error: 'A user with this email already exists' },
                { status: 400 }
            );
        }

        // Check if there's already a pending invitation for this email
        const { data: existingInvitation } = await supabase
            .from('invitations')
            .select('id, expires_at')
            .eq('email', email)
            .is('used_at', null)
            .single();

        if (existingInvitation) {
            const expiresAt = new Date(existingInvitation.expires_at);
            if (expiresAt > new Date()) {
                return NextResponse.json(
                    { success: false, error: 'An invitation has already been sent to this email' },
                    { status: 400 }
                );
            }
            // Delete expired invitation
            await supabase.from('invitations').delete().eq('id', existingInvitation.id);
        }

        // Generate secure token
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        // Create invitation record
        const { data: invitation, error: insertError } = await supabase
            .from('invitations')
            .insert({
                email,
                token,
                invited_by: user.id,
                expires_at: expiresAt.toISOString(),
            })
            .select()
            .single();

        if (insertError) {
            console.error('Failed to create invitation:', insertError);
            return NextResponse.json(
                { success: false, error: 'Failed to create invitation' },
                { status: 500 }
            );
        }

        // Generate invitation link
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const invitationLink = `${appUrl}/setup-credentials?token=${token}`;

        // In production, you would send an email here
        // For now, we'll return the link in the response
        console.log('Invitation link:', invitationLink);

        return NextResponse.json({
            success: true,
            data: {
                id: invitation.id,
                email: invitation.email,
                invitationLink,
                expiresAt: invitation.expires_at,
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
