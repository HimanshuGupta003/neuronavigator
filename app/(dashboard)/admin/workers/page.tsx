'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, Search, Clock, UserPlus } from 'lucide-react';
import { Profile } from '@/lib/types';
import Link from 'next/link';
import styles from './workers.module.css';

export default function WorkersPage() {
    const supabase = createClient();
    const [workers, setWorkers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadWorkers();
    }, []);

    async function loadWorkers() {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'worker')
                .order('created_at', { ascending: false });

            if (data) {
                setWorkers(data as Profile[]);
            }
        } catch (error) {
            console.error('Failed to load workers:', error);
        } finally {
            setLoading(false);
        }
    }

    const filteredWorkers = workers.filter(w =>
        w.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        w.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Workers</h1>
                    <p className={styles.subtitle}>Manage all registered workers</p>
                </div>
                <Link href="/admin/invitations" className={styles.inviteButton}>
                    <UserPlus size={18} />
                    Invite Worker
                </Link>
            </div>

            {/* Workers Card */}
            <div className={styles.card}>
                {/* Search */}
                <div className={styles.searchContainer}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search workers..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                    </div>
                ) : filteredWorkers.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <Users size={32} />
                        </div>
                        <p className={styles.emptyTitle}>
                            {search ? 'No workers found' : 'No workers yet'}
                        </p>
                        <p className={styles.emptyText}>
                            {search ? 'Try a different search term' : 'Invite workers to get started'}
                        </p>
                    </div>
                ) : (
                    <div className={styles.workerList}>
                        {filteredWorkers.map((worker) => (
                            <div key={worker.id} className={styles.workerItem}>
                                <div className={styles.workerInfo}>
                                    <div className={styles.workerAvatar}>
                                        {worker.full_name?.charAt(0) || worker.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className={styles.workerName}>
                                            {worker.full_name || 'Unnamed'}
                                        </p>
                                        <p className={styles.workerEmail}>{worker.email}</p>
                                    </div>
                                </div>
                                <div className={styles.workerDate}>
                                    <Clock size={14} />
                                    Joined {new Date(worker.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Count */}
                {!loading && filteredWorkers.length > 0 && (
                    <div className={styles.countSection}>
                        <p className={styles.countText}>
                            Showing {filteredWorkers.length} of {workers.length} workers
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
