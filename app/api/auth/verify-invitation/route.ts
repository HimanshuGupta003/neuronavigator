import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        // Use admin client to bypass RLS for token verification
        const supabase = await createAdminClient();
        const token = request.nextUrl.searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Token is required' },
                { status: 400 }
            );
        }

        // Find invitation by token
        const { data: invitation, error } = await supabase
            .from('invitations')
            .select('id, email, expires_at, used_at')
            .eq('token', token)
            .single();

        if (error || !invitation) {
            return NextResponse.json(
                { success: false, error: 'Invalid invitation token' },
                { status: 404 }
            );
        }

        // Check if invitation is already used
        if (invitation.used_at) {
            return NextResponse.json(
                { success: false, error: 'This invitation has already been used' },
                { status: 400 }
            );
        }

        // Check if invitation is expired
        const expiresAt = new Date(invitation.expires_at);
        if (expiresAt < new Date()) {
            return NextResponse.json(
                { success: false, error: 'This invitation has expired' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                id: invitation.id,
                email: invitation.email,
            },
        });
    } catch (error) {
        console.error('Verify invitation error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
