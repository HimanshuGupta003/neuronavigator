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

        // Create user account using admin client
        const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
            email: invitation.email,
            password: password,
            email_confirm: true, // Auto-confirm email since they came via invite
        });

        if (authError || !authData.user) {
            console.error('Failed to create auth user:', authError);
            return NextResponse.json(
                { success: false, error: authError?.message || 'Failed to create user account' },
                { status: 500 }
            );
        }

        // Create profile
        const { error: profileError } = await adminSupabase
            .from('profiles')
            .insert({
                id: authData.user.id,
                email: invitation.email,
                full_name: fullName,
                role: 'worker',
            });

        if (profileError) {
            console.error('Failed to create profile:', profileError);
            // Clean up auth user if profile creation fails
            await adminSupabase.auth.admin.deleteUser(authData.user.id);
            return NextResponse.json(
                { success: false, error: 'Failed to create user profile' },
                { status: 500 }
            );
        }

        // Mark invitation as used
        await adminSupabase
            .from('invitations')
            .update({ used_at: new Date().toISOString() })
            .eq('id', invitation.id);

        return NextResponse.json({
            success: true,
            data: {
                userId: authData.user.id,
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
