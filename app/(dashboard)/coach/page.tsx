'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mic, Clock, FileText, Play, Square, MapPin, AlertCircle, ArrowRight, Users } from 'lucide-react';
import { Profile, Shift, Entry } from '@/lib/types';
import Link from 'next/link';
import styles from './coach.module.css';

export default function CoachDashboardPage() {
    const supabase = createClient();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [activeShift, setActiveShift] = useState<Shift | null>(null);
    const [recentEntries, setRecentEntries] = useState<Entry[]>([]);
    const [loading, setLoading] = useState(true);
    const [shiftLoading, setShiftLoading] = useState(false);
    const [shiftDuration, setShiftDuration] = useState('0:00:00');
    const [locationError, setLocationError] = useState<string | null>(null);

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
                .eq('coach_id', user.id)
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
                .eq('coach_id', user.id)
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
        setLocationError(null);
        
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // GPS is REQUIRED for EVV compliance
            if (!navigator.geolocation) {
                setLocationError('Location services are not available on this device. GPS is required to clock in.');
                setShiftLoading(false);
                return;
            }

            let lat: number | null = null;
            let lng: number | null = null;

            try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 15000,
                    });
                });
                lat = position.coords.latitude;
                lng = position.coords.longitude;
            } catch (geoError: unknown) {
                const error = geoError as GeolocationPositionError;
                let errorMessage = 'Unable to get your location. ';
                
                if (error.code === 1) {
                    errorMessage = 'Location permission denied. Please enable location access in your browser settings to clock in.';
                } else if (error.code === 2) {
                    errorMessage = 'Unable to determine your location. Please ensure GPS is enabled and try again.';
                } else if (error.code === 3) {
                    errorMessage = 'Location request timed out. Please try again in an area with better GPS signal.';
                }
                
                setLocationError(errorMessage);
                setShiftLoading(false);
                return;
            }

            if (lat === null || lng === null) {
                setLocationError('Could not obtain GPS coordinates. Please enable location services and try again.');
                setShiftLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('shifts')
                .insert({
                    coach_id: user.id,
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
            setLocationError('Failed to clock in. Please try again.');
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
            case 'green': return '#43a047';
            case 'yellow': return '#ffa726';
            case 'red': return '#e53935';
            default: return '#9e9e9e';
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

            {/* Large Green CLOCK IN Button - Prominent as per client request */}
            {!activeShift && (
                <button
                    onClick={handleClockIn}
                    disabled={shiftLoading}
                    className={styles.bigClockInButton}
                >
                    {shiftLoading ? (
                        <div className={styles.buttonSpinner}></div>
                    ) : (
                        <>
                            <Play size={32} />
                            <span>CLOCK IN</span>
                        </>
                    )}
                </button>
            )}

            {/* Location Error Message */}
            {locationError && (
                <div className={styles.locationError}>
                    <AlertCircle size={20} />
                    <span>{locationError}</span>
                </div>
            )}

            {/* Shift Timer Card (when clocked in) */}
            {activeShift && (
                <div className={styles.shiftCard}>
                    <div className={styles.shiftContent}>
                        <div className={styles.shiftInfo}>
                            <div className={styles.shiftIcon}>
                                <Clock size={30} />
                            </div>
                            <div>
                                <p className={styles.shiftLabel}>Shift Duration</p>
                                <p className={styles.shiftTimer}>{shiftDuration}</p>
                                <p className={styles.shiftStarted}>
                                    <MapPin size={14} />
                                    Started at {new Date(activeShift.clock_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleClockOut}
                            disabled={shiftLoading}
                            className={styles.shiftButtonOut}
                        >
                            {shiftLoading ? (
                                <div className={styles.buttonSpinner}></div>
                            ) : (
                                <>
                                    <Square size={18} />
                                    Clock Out
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className={styles.actionsGrid}>
                <Link href="/coach/record" className={styles.actionCard}>
                    <div className={styles.actionIconRecord}>
                        <Mic size={30} />
                    </div>
                    <p className={styles.actionTitle}>Record Entry</p>
                    <p className={styles.actionDesc}>Voice log</p>
                </Link>

                <Link href="/coach/clients" className={styles.actionCard}>
                    <div className={styles.actionIconClients}>
                        <Users size={30} />
                    </div>
                    <p className={styles.actionTitle}>My Clients</p>
                    <p className={styles.actionDesc}>Manage</p>
                </Link>

                <Link href="/coach/entries" className={styles.actionCard}>
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
                        <Link href="/coach/entries" className={styles.viewAllLink}>
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
                                        boxShadow: `0 0 12px ${getStatusColor(entry.status)}40`
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
