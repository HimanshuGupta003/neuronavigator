import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface CreateEntryRequest {
    clientId: string;
    clientName?: string;
    mood: 'good' | 'neutral' | 'bad';
    rawTranscript: string;
    formattedNote: string;
    summary: string;
    tags: string[];
    latitude?: number;
    longitude?: number;
}

// POST - Create new entry
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

        // Parse request body
        const body: CreateEntryRequest = await request.json();
        const { 
            clientId, 
            mood, 
            rawTranscript, 
            formattedNote, 
            summary, 
            tags,
            latitude,
            longitude 
        } = body;

        // Validate required fields
        if (!clientId || !formattedNote) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Insert entry into database
        const { data: entry, error: insertError } = await supabase
            .from('entries')
            .insert({
                worker_id: user.id,
                status: mood === 'good' ? 'green' : mood === 'bad' ? 'red' : 'yellow',
                raw_transcript: rawTranscript,
                processed_text: formattedNote,
                tags: tags,
                gps_lat: latitude || null,
                gps_lng: longitude || null,
                client_name: body.clientName || null,
            })
            .select()
            .single();

        if (insertError) {
            console.error('Insert error:', insertError);
            return NextResponse.json(
                { success: false, error: insertError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            entry: entry,
            message: 'Entry saved successfully',
        });

    } catch (error) {
        console.error('Create entry error:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}

// GET - Get entries for current user
export async function GET(request: NextRequest) {
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

        // Get query params
        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('clientId');
        const limit = parseInt(searchParams.get('limit') || '50');

        // Build query
        let query = supabase
            .from('entries')
            .select('*')
            .eq('worker_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        // Filter by client name if specified
        if (clientId) {
            // clientId here is actually client_name for filtering
            query = query.eq('client_name', clientId);
        }

        const { data: entries, error: fetchError } = await query;

        if (fetchError) {
            return NextResponse.json(
                { success: false, error: fetchError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            entries: entries,
        });

    } catch (error) {
        console.error('Get entries error:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}
