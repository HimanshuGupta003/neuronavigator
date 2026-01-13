import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createClientServer } from '@/lib/supabase/server';

export async function GET() {
    try {
        // First verify the user is an admin
        const serverClient = await createClientServer();
        const { data: { user } } = await serverClient.auth.getUser();
        
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Use service role to bypass RLS
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

        // Get all stats using service role (bypasses RLS)
        const { count: coachesCount } = await adminClient
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'worker');

        const { count: invitationsCount } = await adminClient
            .from('invitations')
            .select('*', { count: 'exact', head: true })
            .is('used_at', null)
            .gt('expires_at', new Date().toISOString());

        const { count: entriesCount } = await adminClient
            .from('entries')
            .select('*', { count: 'exact', head: true });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count: todayCount } = await adminClient
            .from('entries')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today.toISOString());

        // Get recent coaches
        const { data: recentCoaches } = await adminClient
            .from('profiles')
            .select('*')
            .eq('role', 'worker')
            .order('created_at', { ascending: false })
            .limit(5);

        return NextResponse.json({ 
            stats: {
                totalCoaches: coachesCount || 0,
                pendingInvitations: invitationsCount || 0,
                totalEntries: entriesCount || 0,
                todayEntries: todayCount || 0,
            },
            recentCoaches: recentCoaches || []
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
