'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, Search, Clock, UserPlus, FileText } from 'lucide-react';
import { Profile } from '@/lib/types';
import Link from 'next/link';
import styles from './workers.module.css';

interface CoachWithStats extends Profile {
    client_count: number;
    entries_count: number;
    last_active: string | null;
}

export default function JobCoachesPage() {
    const supabase = createClient();
    const [coaches, setCoaches] = useState<CoachWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadCoaches();
    }, []);

    async function loadCoaches() {
        try {
            const response = await fetch('/api/admin/coaches');
            const data = await response.json();
            
            if (response.ok) {
                setCoaches(data.coaches as CoachWithStats[]);
            } else {
                console.error('Failed to load coaches:', data.error);
            }
        } catch (error) {
            console.error('Failed to load coaches:', error);
        } finally {
            setLoading(false);
        }
    }

    const filteredCoaches = coaches.filter(c =>
        c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Job Coaches</h1>
                    <p className={styles.subtitle}>Manage all registered Job Coaches</p>
                </div>
                <Link href="/admin/invitations" className={styles.inviteButton}>
                    <UserPlus size={18} />
                    Invite Coach
                </Link>
            </div>

            {/* Search & Count */}
            <div className={styles.searchSection}>
                <div className={styles.searchContainer}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search coaches..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                <p className={styles.coachCount}>{filteredCoaches.length} coaches</p>
            </div>

            {/* Coaches Card */}
            <div className={styles.card}>
                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                    </div>
                ) : filteredCoaches.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <Users size={32} />
                        </div>
                        <p className={styles.emptyTitle}>
                            {search ? 'No coaches found' : 'No Job Coaches yet'}
                        </p>
                        <p className={styles.emptyText}>
                            {search ? 'Try a different search term' : 'Invite Job Coaches to get started'}
                        </p>
                    </div>
                ) : (
                    <div className={styles.coachList}>
                        {filteredCoaches.map((coach) => (
                            <div key={coach.id} className={styles.coachItem}>
                                <div className={styles.coachAvatar}>
                                    {coach.full_name?.charAt(0) || coach.email.charAt(0).toUpperCase()}
                                </div>
                                <div className={styles.coachInfo}>
                                    <p className={styles.coachName}>
                                        {coach.full_name || 'Unnamed Coach'}
                                    </p>
                                    <p className={styles.coachEmail}>{coach.email}</p>
                                </div>
                                <div className={styles.coachStats}>
                                    <span className={styles.statItem}>
                                        <Users size={14} />
                                        {coach.client_count} clients
                                    </span>
                                    <span className={styles.statItem}>
                                        <FileText size={14} />
                                        {coach.entries_count} notes
                                    </span>
                                </div>
                                <div className={styles.coachMeta}>
                                    <span className={styles.coachDate}>
                                        <Clock size={14} />
                                        {coach.last_active 
                                            ? `Active ${new Date(coach.last_active).toLocaleDateString()}`
                                            : `Joined ${new Date(coach.created_at).toLocaleDateString()}`
                                        }
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
