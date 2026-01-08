'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, UserPlus, FileText, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { Profile, Invitation, Entry } from '@/lib/types';
import Link from 'next/link';

export default function AdminDashboardPage() {
    const supabase = createClient();
    const [stats, setStats] = useState({
        totalWorkers: 0,
        pendingInvitations: 0,
        totalEntries: 0,
        todayEntries: 0,
    });
    const [recentWorkers, setRecentWorkers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        try {
            // Get workers count
            const { count: workersCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'worker');

            // Get pending invitations count
            const { count: invitationsCount } = await supabase
                .from('invitations')
                .select('*', { count: 'exact', head: true })
                .is('used_at', null)
                .gt('expires_at', new Date().toISOString());

            // Get total entries count
            const { count: entriesCount } = await supabase
                .from('entries')
                .select('*', { count: 'exact', head: true });

            // Get today's entries count
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { count: todayCount } = await supabase
                .from('entries')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', today.toISOString());

            // Get recent workers
            const { data: workers } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'worker')
                .order('created_at', { ascending: false })
                .limit(5);

            setStats({
                totalWorkers: workersCount || 0,
                pendingInvitations: invitationsCount || 0,
                totalEntries: entriesCount || 0,
                todayEntries: todayCount || 0,
            });

            if (workers) {
                setRecentWorkers(workers as Profile[]);
            }
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    }

    const cardStyle: React.CSSProperties = {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    };

    const statCards = [
        { label: 'Total Workers', value: stats.totalWorkers, icon: Users, color: '#6366f1', bgColor: '#eef2ff' },
        { label: 'Pending Invitations', value: stats.pendingInvitations, icon: UserPlus, color: '#f59e0b', bgColor: '#fffbeb' },
        { label: 'Total Entries', value: stats.totalEntries, icon: FileText, color: '#22c55e', bgColor: '#f0fdf4' },
        { label: 'Today\'s Entries', value: stats.todayEntries, icon: TrendingUp, color: '#3b82f6', bgColor: '#eff6ff' },
    ];

    const quickActions = [
        { label: 'Manage Workers', description: 'View and manage all workers', icon: Users, href: '/admin/workers', color: '#6366f1' },
        { label: 'View Reports', description: 'Browse generated reports', icon: FileText, href: '/admin/reports', color: '#22c55e' },
        { label: 'Invitations', description: 'Manage pending invitations', icon: UserPlus, href: '/admin/invitations', color: '#f59e0b' },
    ];

    return (
        <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>Admin Dashboard</h1>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Manage workers and monitor activity</p>
                </div>
                <Link href="/admin/invitations" style={{ textDecoration: 'none' }}>
                    <button style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        backgroundColor: '#6366f1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
                    }}>
                        <UserPlus style={{ width: '18px', height: '18px' }} />
                        Invite Worker
                    </button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {statCards.map((stat) => (
                    <div key={stat.label} style={cardStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                backgroundColor: stat.bgColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <stat.icon style={{ width: '24px', height: '24px', color: stat.color }} />
                            </div>
                            <div>
                                <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>
                                    {loading ? '-' : stat.value}
                                </p>
                                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Workers */}
            <div style={{ ...cardStyle, marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>Recent Workers</h2>
                        <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>Latest workers added to the system</p>
                    </div>
                    {recentWorkers.length > 0 && (
                        <Link href="/admin/workers" style={{ fontSize: '14px', color: '#6366f1', textDecoration: 'none', fontWeight: '500' }}>
                            View All →
                        </Link>
                    )}
                </div>

                {loading ? (
                    <div style={{ padding: '40px 0', textAlign: 'center' }}>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            border: '3px solid #6366f1',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto'
                        }} />
                    </div>
                ) : recentWorkers.length === 0 ? (
                    <div style={{ padding: '40px 0', textAlign: 'center' }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '12px',
                            backgroundColor: '#f3f4f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px auto'
                        }}>
                            <Users style={{ width: '28px', height: '28px', color: '#9ca3af' }} />
                        </div>
                        <p style={{ fontSize: '15px', fontWeight: '500', color: '#374151', margin: 0 }}>No workers yet</p>
                        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Invite workers to get started</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {recentWorkers.map((worker) => (
                            <div key={worker.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 16px',
                                backgroundColor: '#f9fafb',
                                borderRadius: '10px',
                                border: '1px solid #e5e7eb'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: '#6366f1',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: '600',
                                        fontSize: '14px'
                                    }}>
                                        {worker.full_name?.charAt(0) || worker.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827', margin: 0 }}>
                                            {worker.full_name || 'Unnamed'}
                                        </p>
                                        <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>{worker.email}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280' }}>
                                    <Clock style={{ width: '14px', height: '14px' }} />
                                    {new Date(worker.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {quickActions.map((action) => (
                    <Link key={action.href} href={action.href} style={{ textDecoration: 'none' }}>
                        <div style={{ ...cardStyle, cursor: 'pointer', transition: 'box-shadow 0.2s, border-color 0.2s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '10px',
                                    backgroundColor: `${action.color}15`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <action.icon style={{ width: '22px', height: '22px', color: action.color }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: 0 }}>{action.label}</p>
                                    <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 0 0' }}>{action.description}</p>
                                </div>
                                <ArrowRight style={{ width: '18px', height: '18px', color: '#9ca3af' }} />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
