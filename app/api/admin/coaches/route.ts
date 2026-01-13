import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createClientServer } from '@/lib/supabase/server';

export async function GET() {
    try {
        // First verify the user is an admin using server client
        const serverClient = await createClientServer();
        const { data: { user } } = await serverClient.auth.getUser();
        
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Use service role to check admin status (bypasses RLS)
        const adminClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Verify the user is an admin
        const { data: profile } = await adminClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Fetch all workers using service role (bypasses RLS)
        const { data: coaches, error: coachesError } = await adminClient
            .from('profiles')
            .select('*')
            .eq('role', 'worker')
            .order('created_at', { ascending: false });

        if (coachesError) {
            return NextResponse.json({ error: coachesError.message }, { status: 500 });
        }

        // Enrich coaches with activity stats
        const enrichedCoaches = await Promise.all(
            (coaches || []).map(async (coach) => {
                // Get client count
                const { count: clientCount } = await adminClient
                    .from('clients')
                    .select('*', { count: 'exact', head: true })
                    .eq('coach_id', coach.id);

                // Get entries count
                const { count: entriesCount } = await adminClient
                    .from('entries')
                    .select('*', { count: 'exact', head: true })
                    .eq('worker_id', coach.id);

                // Get last entry date
                const { data: lastEntry } = await adminClient
                    .from('entries')
                    .select('created_at')
                    .eq('worker_id', coach.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                return {
                    ...coach,
                    client_count: clientCount || 0,
                    entries_count: entriesCount || 0,
                    last_active: lastEntry?.created_at || null,
                };
            })
        );

        return NextResponse.json({ 
            coaches: enrichedCoaches,
            count: enrichedCoaches.length
        });
    } catch (error) {
        console.error('Error fetching coaches:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
