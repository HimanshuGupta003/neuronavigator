'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, UserPlus, FileText, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { Profile } from '@/lib/types';
import Link from 'next/link';
import styles from './admin.module.css';

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
            const { count: workersCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'worker');

            const { count: invitationsCount } = await supabase
                .from('invitations')
                .select('*', { count: 'exact', head: true })
                .is('used_at', null)
                .gt('expires_at', new Date().toISOString());

            const { count: entriesCount } = await supabase
                .from('entries')
                .select('*', { count: 'exact', head: true });

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { count: todayCount } = await supabase
                .from('entries')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', today.toISOString());

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

    const statCards = [
        { label: 'Total Workers', value: stats.totalWorkers, icon: Users, color: '#818cf8' },
        { label: 'Pending Invitations', value: stats.pendingInvitations, icon: UserPlus, color: '#fbbf24' },
        { label: 'Total Entries', value: stats.totalEntries, icon: FileText, color: '#4ade80' },
        { label: 'Today\'s Entries', value: stats.todayEntries, icon: TrendingUp, color: '#60a5fa' },
    ];

    const quickActions = [
        { label: 'Manage Workers', description: 'View and manage all workers', icon: Users, href: '/admin/workers', color: '#818cf8' },
        { label: 'View Reports', description: 'Browse generated reports', icon: FileText, href: '/admin/reports', color: '#4ade80' },
        { label: 'Invitations', description: 'Manage pending invitations', icon: UserPlus, href: '/admin/invitations', color: '#fbbf24' },
    ];

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Admin Dashboard</h1>
                    <p className={styles.subtitle}>Manage workers and monitor activity</p>
                </div>
                <Link href="/admin/invitations" className={styles.inviteButton}>
                    <UserPlus size={18} />
                    Invite Worker
                </Link>
            </div>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                {statCards.map((stat) => (
                    <div key={stat.label} className={styles.statCard}>
                        <div className={styles.statIcon} style={{ backgroundColor: `${stat.color}20`, borderColor: `${stat.color}40` }}>
                            <stat.icon size={26} style={{ color: stat.color }} />
                        </div>
                        <div className={styles.statContent}>
                            <p className={styles.statValue}>{loading ? '-' : stat.value}</p>
                            <p className={styles.statLabel}>{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Workers */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <div>
                        <h2 className={styles.cardTitle}>Recent Workers</h2>
                        <p className={styles.cardSubtitle}>Latest workers added to the system</p>
                    </div>
                    {recentWorkers.length > 0 && (
                        <Link href="/admin/workers" className={styles.viewAllLink}>
                            View All
                            <ArrowRight size={16} />
                        </Link>
                    )}
                </div>

                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                    </div>
                ) : recentWorkers.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <Users size={32} />
                        </div>
                        <p className={styles.emptyTitle}>No workers yet</p>
                        <p className={styles.emptyText}>Invite workers to get started</p>
                    </div>
                ) : (
                    <div className={styles.workerList}>
                        {recentWorkers.map((worker) => (
                            <div key={worker.id} className={styles.workerItem}>
                                <div className={styles.workerInfo}>
                                    <div className={styles.workerAvatar}>
                                        {worker.full_name?.charAt(0) || worker.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className={styles.workerName}>{worker.full_name || 'Unnamed'}</p>
                                        <p className={styles.workerEmail}>{worker.email}</p>
                                    </div>
                                </div>
                                <div className={styles.workerDate}>
                                    <Clock size={14} />
                                    {new Date(worker.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className={styles.actionsGrid}>
                {quickActions.map((action) => (
                    <Link key={action.href} href={action.href} className={styles.actionCard}>
                        <div className={styles.actionIcon} style={{ backgroundColor: `${action.color}20`, borderColor: `${action.color}40` }}>
                            <action.icon size={24} style={{ color: action.color }} />
                        </div>
                        <div className={styles.actionContent}>
                            <p className={styles.actionTitle}>{action.label}</p>
                            <p className={styles.actionDesc}>{action.description}</p>
                        </div>
                        <ArrowRight size={20} className={styles.actionArrow} />
                    </Link>
                ))}
            </div>
        </div>
    );
}
