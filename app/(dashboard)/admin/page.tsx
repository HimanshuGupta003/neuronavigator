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
        totalCoaches: 0,
        pendingInvitations: 0,
        totalEntries: 0,
        todayEntries: 0,
    });
    const [recentCoaches, setRecentCoaches] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        try {
            const response = await fetch('/api/admin/stats');
            const data = await response.json();
            
            if (response.ok) {
                setStats(data.stats);
                setRecentCoaches(data.recentCoaches as Profile[]);
            } else {
                console.error('Failed to load stats:', data.error);
            }
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    }

    // Removed "Total Workers" stat as per client request
    const statCards = [
        { label: 'Job Coaches', value: stats.totalCoaches, icon: Users, color: '#0284c7' },
        { label: 'Pending Invitations', value: stats.pendingInvitations, icon: UserPlus, color: '#ca8a04' },
        { label: 'Total Notes', value: stats.totalEntries, icon: FileText, color: '#16a34a' },
        { label: 'Today\'s Notes', value: stats.todayEntries, icon: TrendingUp, color: '#7c3aed' },
    ];

    const quickActions = [
        { href: '/admin/invitations', icon: UserPlus, label: 'Invite Coach', color: '#0284c7' },
        { href: '/admin/workers', icon: Users, label: 'View Coaches', color: '#16a34a' },
        { href: '/admin/reports', icon: FileText, label: 'Reports', color: '#7c3aed' },
    ];

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>Admin Dashboard</h1>
                <p className={styles.subtitle}>Manage your Job Coaches and view reports</p>
            </div>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                {statCards.map((stat, i) => (
                    <div key={i} className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: `${stat.color}15`, color: stat.color }}>
                            <stat.icon size={24} />
                        </div>
                        <div className={styles.statInfo}>
                            <p className={styles.statValue}>{loading ? '-' : stat.value}</p>
                            <p className={styles.statLabel}>{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className={styles.card}>
                <h2 className={styles.cardTitle}>Quick Actions</h2>
                <div className={styles.actionsGrid}>
                    {quickActions.map((action, i) => (
                        <Link key={i} href={action.href} className={styles.actionCard}>
                            <div className={styles.actionIcon} style={{ background: `${action.color}15`, color: action.color }}>
                                <action.icon size={24} />
                            </div>
                            <span className={styles.actionLabel}>{action.label}</span>
                            <ArrowRight size={18} className={styles.actionArrow} />
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Coaches */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <div>
                        <h2 className={styles.cardTitle}>Recent Job Coaches</h2>
                        <p className={styles.cardSubtitle}>Recently added coaches</p>
                    </div>
                    <Link href="/admin/workers" className={styles.viewAllLink}>
                        View All
                        <ArrowRight size={16} />
                    </Link>
                </div>

                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                    </div>
                ) : recentCoaches.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <Users size={28} />
                        </div>
                        <p className={styles.emptyTitle}>No coaches yet</p>
                        <p className={styles.emptyText}>Invite your first Job Coach to get started</p>
                    </div>
                ) : (
                    <div className={styles.coachList}>
                        {recentCoaches.map((coach) => (
                            <div key={coach.id} className={styles.coachItem}>
                                <div className={styles.coachAvatar}>
                                    {coach.full_name?.charAt(0) || 'J'}
                                </div>
                                <div className={styles.coachInfo}>
                                    <p className={styles.coachName}>{coach.full_name || 'Job Coach'}</p>
                                    <p className={styles.coachEmail}>{coach.email}</p>
                                </div>
                                <div className={styles.coachMeta}>
                                    <Clock size={14} />
                                    {new Date(coach.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
