import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        // Use admin client since there's no authenticated user yet
        const adminSupabase = await createAdminClient();

        const { token, fullName, password } = await request.json();

        if (!token || !fullName || !password) {
            return NextResponse.json(
                { success: false, error: 'Token, full name, and password are required' },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { success: false, error: 'Password must be at least 8 characters' },
                { status: 400 }
            );
        }

        // Find and validate invitation using admin client
        const { data: invitation, error: invError } = await adminSupabase
            .from('invitations')
            .select('id, email, expires_at, used_at')
            .eq('token', token)
            .single();

        if (invError || !invitation) {
            return NextResponse.json(
                { success: false, error: 'Invalid invitation token' },
                { status: 404 }
            );
        }

        if (invitation.used_at) {
            return NextResponse.json(
                { success: false, error: 'This invitation has already been used' },
                { status: 400 }
            );
        }

        const expiresAt = new Date(invitation.expires_at);
        if (expiresAt < new Date()) {
            return NextResponse.json(
                { success: false, error: 'This invitation has expired' },
                { status: 400 }
            );
        }

        // Check if user was already created by Supabase invite
        const { data: existingUsers } = await adminSupabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === invitation.email);

        let userId: string;

        if (existingUser) {
            // User exists (created by inviteUserByEmail) - update their password
            console.log('User already exists, updating password...');
            const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
                existingUser.id,
                {
                    password: password,
                    email_confirm: true,
                }
            );

            if (updateError) {
                console.error('Failed to update user password:', updateError);
                return NextResponse.json(
                    { success: false, error: 'Failed to set password' },
                    { status: 500 }
                );
            }

            userId = existingUser.id;
        } else {
            // Create new user if not exists
            console.log('Creating new user...');
            const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
                email: invitation.email,
                password: password,
                email_confirm: true,
            });

            if (authError || !authData.user) {
                console.error('Failed to create auth user:', authError);
                return NextResponse.json(
                    { success: false, error: authError?.message || 'Failed to create user account' },
                    { status: 500 }
                );
            }

            userId = authData.user.id;
        }

        // Check if profile already exists
        const { data: existingProfile } = await adminSupabase
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .single();

        if (!existingProfile) {
            // Create profile if it doesn't exist
            const { error: profileError } = await adminSupabase
                .from('profiles')
                .insert({
                    id: userId,
                    email: invitation.email,
                    full_name: fullName,
                    role: 'worker',
                });

            if (profileError) {
                console.error('Failed to create profile:', profileError);
                return NextResponse.json(
                    { success: false, error: 'Failed to create user profile' },
                    { status: 500 }
                );
            }
        } else {
            // Update existing profile with full name
            await adminSupabase
                .from('profiles')
                .update({ full_name: fullName })
                .eq('id', userId);
        }

        // Mark invitation as used
        await adminSupabase
            .from('invitations')
            .update({ used_at: new Date().toISOString() })
            .eq('id', invitation.id);

        return NextResponse.json({
            success: true,
            data: {
                userId: userId,
                email: invitation.email,
            },
        });
    } catch (error) {
        console.error('Setup credentials error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
