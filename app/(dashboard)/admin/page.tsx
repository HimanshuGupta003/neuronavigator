'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Users, FileText, UserPlus, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { Profile } from '@/lib/types';

interface DashboardStats {
    totalWorkers: number;
    pendingInvitations: number;
    totalEntries: number;
    todayEntries: number;
}

export default function AdminDashboardPage() {
    const supabase = createClient();
    const [stats, setStats] = useState<DashboardStats>({
        totalWorkers: 0,
        pendingInvitations: 0,
        totalEntries: 0,
        todayEntries: 0,
    });
    const [recentWorkers, setRecentWorkers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadDashboard() {
            try {
                // Get total workers
                const { count: workerCount } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('role', 'worker');

                // Get pending invitations
                const { count: invitationCount } = await supabase
                    .from('invitations')
                    .select('*', { count: 'exact', head: true })
                    .is('used_at', null)
                    .gte('expires_at', new Date().toISOString());

                // Get total entries
                const { count: entriesCount } = await supabase
                    .from('entries')
                    .select('*', { count: 'exact', head: true });

                // Get today's entries
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const { count: todayCount } = await supabase
                    .from('entries')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', today.toISOString());

                setStats({
                    totalWorkers: workerCount || 0,
                    pendingInvitations: invitationCount || 0,
                    totalEntries: entriesCount || 0,
                    todayEntries: todayCount || 0,
                });

                // Get recent workers
                const { data: workers } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('role', 'worker')
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (workers) {
                    setRecentWorkers(workers as Profile[]);
                }
            } catch (error) {
                console.error('Failed to load dashboard:', error);
            } finally {
                setLoading(false);
            }
        }

        loadDashboard();
    }, [supabase]);

    const statCards = [
        {
            title: 'Total Workers',
            value: stats.totalWorkers,
            icon: Users,
            color: 'text-primary',
            bgColor: 'bg-primary/10',
        },
        {
            title: 'Pending Invitations',
            value: stats.pendingInvitations,
            icon: UserPlus,
            color: 'text-status-yellow',
            bgColor: 'bg-status-yellow-bg',
        },
        {
            title: 'Total Entries',
            value: stats.totalEntries,
            icon: FileText,
            color: 'text-status-green',
            bgColor: 'bg-status-green-bg',
        },
        {
            title: "Today's Entries",
            value: stats.todayEntries,
            icon: TrendingUp,
            color: 'text-primary',
            bgColor: 'bg-primary/10',
        },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Admin Dashboard</h1>
                    <p className="text-muted mt-1">Manage workers and monitor activity</p>
                </div>
                <Button onClick={() => window.location.href = '/admin/invitations'}>
                    <UserPlus className="w-4 h-4" />
                    Invite Worker
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => (
                    <Card key={stat.title} padding="md" hover>
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">
                                    {loading ? '-' : stat.value}
                                </p>
                                <p className="text-sm text-muted">{stat.title}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Recent Workers */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Workers</CardTitle>
                    <CardDescription>Latest workers added to the system</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-8 text-center text-muted">Loading...</div>
                    ) : recentWorkers.length === 0 ? (
                        <div className="py-8 text-center">
                            <Users className="w-12 h-12 text-muted mx-auto mb-3" />
                            <p className="text-muted">No workers yet</p>
                            <p className="text-sm text-muted/70 mt-1">
                                Invite workers to get started
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {recentWorkers.map((worker) => (
                                <div key={worker.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-sm font-bold text-primary">
                                                {worker.full_name?.charAt(0) || worker.email.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">
                                                {worker.full_name || 'Unnamed Worker'}
                                            </p>
                                            <p className="text-sm text-muted">{worker.email}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted">
                                            Joined {new Date(worker.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card hover className="cursor-pointer" onClick={() => window.location.href = '/admin/workers'}>
                    <CardContent className="flex items-center gap-4 py-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium text-foreground">Manage Workers</p>
                            <p className="text-sm text-muted">View and manage all workers</p>
                        </div>
                    </CardContent>
                </Card>

                <Card hover className="cursor-pointer" onClick={() => window.location.href = '/admin/reports'}>
                    <CardContent className="flex items-center gap-4 py-4">
                        <div className="w-12 h-12 rounded-xl bg-status-green-bg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-status-green" />
                        </div>
                        <div>
                            <p className="font-medium text-foreground">View Reports</p>
                            <p className="text-sm text-muted">Browse all generated reports</p>
                        </div>
                    </CardContent>
                </Card>

                <Card hover className="cursor-pointer" onClick={() => window.location.href = '/admin/invitations'}>
                    <CardContent className="flex items-center gap-4 py-4">
                        <div className="w-12 h-12 rounded-xl bg-status-yellow-bg flex items-center justify-center">
                            <UserPlus className="w-6 h-6 text-status-yellow" />
                        </div>
                        <div>
                            <p className="font-medium text-foreground">Invitations</p>
                            <p className="text-sm text-muted">Manage pending invitations</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
