import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get token ID from request
        const { tokenId, clientId } = await request.json();

        if (!tokenId && !clientId) {
            return NextResponse.json(
                { success: false, error: 'Token ID or Client ID is required' },
                { status: 400 }
            );
        }

        // Build query
        let query = supabase
            .from('client_safety_tokens')
            .select('*, clients!inner(coach_id)')
            .is('revoked_at', null);

        if (tokenId) {
            query = query.eq('id', tokenId);
        } else {
            query = query.eq('client_id', clientId);
        }

        const { data: token, error: tokenError } = await query.single();

        if (tokenError || !token) {
            return NextResponse.json(
                { success: false, error: 'Token not found' },
                { status: 404 }
            );
        }

        // Verify the coach owns this client
        if (token.clients.coach_id !== user.id) {
            return NextResponse.json(
                { success: false, error: 'You do not have access to revoke this token' },
                { status: 403 }
            );
        }

        // Revoke the token
        const { error: updateError } = await supabase
            .from('client_safety_tokens')
            .update({ revoked_at: new Date().toISOString() })
            .eq('id', token.id);

        if (updateError) {
            console.error('Revoke error:', updateError);
            return NextResponse.json(
                { success: false, error: 'Failed to revoke token' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Safety link has been revoked',
        });

    } catch (error) {
        console.error('Revoke safety link error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
