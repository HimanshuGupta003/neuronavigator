'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mic, Clock, FileText, Play, Square, MapPin, AlertCircle, ArrowRight } from 'lucide-react';
import { Profile, Shift, Entry } from '@/lib/types';
import Link from 'next/link';
import styles from './worker.module.css';

export default function WorkerDashboardPage() {
    const supabase = createClient();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [activeShift, setActiveShift] = useState<Shift | null>(null);
    const [recentEntries, setRecentEntries] = useState<Entry[]>([]);
    const [loading, setLoading] = useState(true);
    const [shiftLoading, setShiftLoading] = useState(false);
    const [shiftDuration, setShiftDuration] = useState('0:00:00');

    useEffect(() => {
        loadDashboard();
    }, []);

    useEffect(() => {
        if (!activeShift) {
            setShiftDuration('0:00:00');
            return;
        }

        const updateDuration = () => {
            const start = new Date(activeShift.clock_in_at);
            const now = new Date();
            const diff = now.getTime() - start.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setShiftDuration(
                `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        };

        updateDuration();
        const interval = setInterval(updateDuration, 1000);
        return () => clearInterval(interval);
    }, [activeShift]);

    async function loadDashboard() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileData) {
                setProfile(profileData as Profile);
            }

            const { data: shiftData } = await supabase
                .from('shifts')
                .select('*')
                .eq('worker_id', user.id)
                .is('clock_out_at', null)
                .order('clock_in_at', { ascending: false })
                .limit(1)
                .single();

            if (shiftData) {
                setActiveShift(shiftData as Shift);
            }

            const { data: entriesData } = await supabase
                .from('entries')
                .select('*')
                .eq('worker_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (entriesData) {
                setRecentEntries(entriesData as Entry[]);
            }
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleClockIn = async () => {
        setShiftLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let lat: number | null = null;
            let lng: number | null = null;

            if (navigator.geolocation) {
                try {
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            enableHighAccuracy: true,
                            timeout: 10000,
                        });
                    });
                    lat = position.coords.latitude;
                    lng = position.coords.longitude;
                } catch (geoError) {
                    console.warn('Failed to get location:', geoError);
                }
            }

            const { data, error } = await supabase
                .from('shifts')
                .insert({
                    worker_id: user.id,
                    clock_in_at: new Date().toISOString(),
                    clock_in_lat: lat,
                    clock_in_lng: lng,
                })
                .select()
                .single();

            if (error) throw error;
            setActiveShift(data as Shift);
        } catch (error) {
            console.error('Failed to clock in:', error);
        } finally {
            setShiftLoading(false);
        }
    };

    const handleClockOut = async () => {
        if (!activeShift) return;
        setShiftLoading(true);
        try {
            let lat: number | null = null;
            let lng: number | null = null;

            if (navigator.geolocation) {
                try {
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            enableHighAccuracy: true,
                            timeout: 10000,
                        });
                    });
                    lat = position.coords.latitude;
                    lng = position.coords.longitude;
                } catch (geoError) {
                    console.warn('Failed to get location:', geoError);
                }
            }

            const { error } = await supabase
                .from('shifts')
                .update({
                    clock_out_at: new Date().toISOString(),
                    clock_out_lat: lat,
                    clock_out_lng: lng,
                })
                .eq('id', activeShift.id);

            if (error) throw error;
            setActiveShift(null);
        } catch (error) {
            console.error('Failed to clock out:', error);
        } finally {
            setShiftLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'green': return '#4ade80';
            case 'yellow': return '#fbbf24';
            case 'red': return '#f87171';
            default: return '#525252';
        }
    };

    return (
        <div className={styles.container}>
            {/* Page Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>
                    Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!
                </h1>
                <p className={styles.subtitle}>
                    {activeShift ? "You're currently clocked in" : 'Clock in to start your shift'}
                </p>
            </div>

            {/* Shift Timer Card */}
            <div className={`${styles.shiftCard} ${activeShift ? styles.shiftCardActive : ''}`}>
                <div className={styles.shiftContent}>
                    <div className={styles.shiftInfo}>
                        <div className={`${styles.shiftIcon} ${activeShift ? styles.shiftIconActive : ''}`}>
                            <Clock size={30} />
                        </div>
                        <div>
                            <p className={styles.shiftLabel}>
                                {activeShift ? 'Shift Duration' : 'Not Clocked In'}
                            </p>
                            <p className={styles.shiftTimer}>
                                {activeShift ? shiftDuration : '--:--:--'}
                            </p>
                            {activeShift && (
                                <p className={styles.shiftStarted}>
                                    <MapPin size={14} />
                                    Started at {new Date(activeShift.clock_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={activeShift ? handleClockOut : handleClockIn}
                        disabled={shiftLoading}
                        className={`${styles.shiftButton} ${activeShift ? styles.shiftButtonOut : styles.shiftButtonIn}`}
                    >
                        {shiftLoading ? (
                            <div className={styles.buttonSpinner}></div>
                        ) : activeShift ? (
                            <>
                                <Square size={18} />
                                Clock Out
                            </>
                        ) : (
                            <>
                                <Play size={18} />
                                Clock In
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Quick Actions */}
            <div className={styles.actionsGrid}>
                <Link href="/worker/record" className={styles.actionCard}>
                    <div className={styles.actionIconRecord}>
                        <Mic size={30} />
                    </div>
                    <p className={styles.actionTitle}>Record Entry</p>
                    <p className={styles.actionDesc}>Voice log</p>
                </Link>

                <Link href="/worker/entries" className={styles.actionCard}>
                    <div className={styles.actionIconEntries}>
                        <FileText size={30} />
                    </div>
                    <p className={styles.actionTitle}>My Entries</p>
                    <p className={styles.actionDesc}>View all</p>
                </Link>
            </div>

            {/* Recent Entries */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <div>
                        <h2 className={styles.cardTitle}>Recent Entries</h2>
                        <p className={styles.cardSubtitle}>Your latest field logs</p>
                    </div>
                    {recentEntries.length > 0 && (
                        <Link href="/worker/entries" className={styles.viewAllLink}>
                            View All
                            <ArrowRight size={16} />
                        </Link>
                    )}
                </div>

                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                        <p className={styles.loadingText}>Loading...</p>
                    </div>
                ) : recentEntries.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <AlertCircle size={32} />
                        </div>
                        <p className={styles.emptyTitle}>No entries yet</p>
                        <p className={styles.emptyText}>Record your first voice log to get started</p>
                    </div>
                ) : (
                    <div className={styles.entryList}>
                        {recentEntries.map((entry) => (
                            <div key={entry.id} className={styles.entryItem}>
                                <div
                                    className={styles.entryStatus}
                                    style={{
                                        backgroundColor: getStatusColor(entry.status),
                                        boxShadow: `0 0 12px ${getStatusColor(entry.status)}60`
                                    }}
                                ></div>
                                <div className={styles.entryContent}>
                                    <p className={styles.entryText}>
                                        {entry.processed_text || entry.raw_transcript || 'No transcript available'}
                                    </p>
                                    <div className={styles.entryMeta}>
                                        <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span>{new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        {entry.client_name && (
                                            <>
                                                <span>•</span>
                                                <span className={styles.entryClient}>{entry.client_name}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
