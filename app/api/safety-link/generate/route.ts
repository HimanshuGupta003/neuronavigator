import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

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

        // Get client ID from request
        const { clientId } = await request.json();

        if (!clientId) {
            return NextResponse.json(
                { success: false, error: 'Client ID is required' },
                { status: 400 }
            );
        }

        // Verify the coach owns this client
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('id, full_name, coach_id')
            .eq('id', clientId)
            .single();

        if (clientError || !client) {
            return NextResponse.json(
                { success: false, error: 'Client not found' },
                { status: 404 }
            );
        }

        if (client.coach_id !== user.id) {
            return NextResponse.json(
                { success: false, error: 'You do not have access to this client' },
                { status: 403 }
            );
        }

        // Check if an active token already exists
        const { data: existingToken } = await supabase
            .from('client_safety_tokens')
            .select('*')
            .eq('client_id', clientId)
            .is('revoked_at', null)
            .single();

        if (existingToken) {
            // Return existing token
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            return NextResponse.json({
                success: true,
                token: existingToken.token,
                link: `${appUrl}/sos/${existingToken.token}`,
                isExisting: true,
                clientName: client.full_name,
            });
        }

        // Generate a new unique token
        const token = randomBytes(32).toString('hex');

        // Insert the new token
        const { data: newToken, error: insertError } = await supabase
            .from('client_safety_tokens')
            .insert({
                client_id: clientId,
                token: token,
                created_by: user.id,
            })
            .select()
            .single();

        if (insertError) {
            console.error('Token creation error:', insertError);
            return NextResponse.json(
                { success: false, error: 'Failed to create safety link' },
                { status: 500 }
            );
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        return NextResponse.json({
            success: true,
            token: newToken.token,
            link: `${appUrl}/sos/${newToken.token}`,
            isExisting: false,
            clientName: client.full_name,
        });

    } catch (error) {
        console.error('Generate safety link error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
