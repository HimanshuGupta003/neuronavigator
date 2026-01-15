'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mic, Clock, FileText, Play, Square, MapPin, AlertCircle, ArrowRight, Users } from 'lucide-react';
import { Profile, Shift, Entry } from '@/lib/types';
import Link from 'next/link';
import styles from './worker.module.css';

export default function CoachDashboardPage() {
    const supabase = createClient();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [activeShift, setActiveShift] = useState<Shift | null>(null);
    const [recentEntries, setRecentEntries] = useState<Entry[]>([]);
    const [clientCount, setClientCount] = useState(0);
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
                .eq('worker_id', user.id)
                .is('clock_out_at', null)
                .order('clock_in_at', { ascending: false })
                .limit(1)
                .single();

            if (shiftData) {
                setActiveShift(shiftData as Shift);
            }

            // Get client count
            const { count } = await supabase
                .from('clients')
                .select('*', { count: 'exact', head: true })
                .eq('coach_id', user.id);

            if (count !== null) {
                setClientCount(count);
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
        setLocationError(null);  // Clear any previous error
        
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
                        timeout: 15000,  // Increased timeout
                    });
                });
                lat = position.coords.latitude;
                lng = position.coords.longitude;
            } catch (geoError: unknown) {
                // GPS permission denied or failed - BLOCK clock-in
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
                return;  // BLOCK clock-in
            }

            // Verify we actually got coordinates
            if (lat === null || lng === null) {
                setLocationError('Could not obtain GPS coordinates. Please enable location services and try again.');
                setShiftLoading(false);
                return;
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
            case 'green': return '#16a34a';
            case 'yellow': return '#ca8a04';
            case 'red': return '#dc2626';
            default: return '#64748b';
        }
    };

    // Helper to strip markdown and clean text for display
    const cleanNoteText = (text: string): string => {
        if (!text) return 'No content available';
        return text
            .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove **bold**
            .replace(/\*([^*]+)\*/g, '$1')     // Remove *italic*
            .replace(/#{1,6}\s?/g, '')         // Remove headers
            .replace(/\n+/g, ' ')              // Replace newlines with space
            .trim();
    };

    const getMoodEmoji = (mood: string) => {
        switch (mood) {
            case 'good': return '🟢';
            case 'neutral': return '🟡';
            case 'bad': return '🔴';
            default: return '📝';
        }
    };

    // Smart timestamp formatting
    const formatSmartTimestamp = (dateStr: string): string => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24));
        const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

        if (daysDiff === 0) {
            return `Today ${time}`;
        } else if (daysDiff === 1) {
            return `Yesterday ${time}`;
        } else if (daysDiff < 7) {
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            return `${dayName} ${time}`;
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
                    {activeShift ? "You're currently clocked in" : 'Ready to start your shift?'}
                </p>
            </div>

            {/* Large Clock In Button - Prominent */}
            {!activeShift && (
                <button
                    onClick={handleClockIn}
                    disabled={shiftLoading}
                    className={styles.clockInButton}
                >
                    {shiftLoading ? (
                        <div className={styles.buttonSpinner}></div>
                    ) : (
                        <>
                            <Play size={28} />
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

            {/* Active Shift Card */}
            {activeShift && (
                <div className={styles.shiftCard}>
                    <div className={styles.shiftContent}>
                        <div className={styles.shiftInfo}>
                            <div className={styles.shiftIcon}>
                                <Clock size={28} />
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
                            className={styles.clockOutButton}
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
                <Link href="/worker/clients" className={styles.actionCard}>
                    <div className={styles.actionIconClients}>
                        <Users size={28} />
                    </div>
                    <div className={styles.actionInfo}>
                        <p className={styles.actionTitle}>My Clients</p>
                        <p className={styles.actionCount}>{clientCount} clients</p>
                    </div>
                </Link>

                <Link href="/worker/record" className={styles.actionCard}>
                    <div className={styles.actionIconRecord}>
                        <Mic size={28} />
                    </div>
                    <div className={styles.actionInfo}>
                        <p className={styles.actionTitle}>Record Note</p>
                        <p className={styles.actionCount}>Voice log</p>
                    </div>
                </Link>

                <Link href="/worker/entries" className={styles.actionCard}>
                    <div className={styles.actionIconEntries}>
                        <FileText size={28} />
                    </div>
                    <div className={styles.actionInfo}>
                        <p className={styles.actionTitle}>Entries</p>
                        <p className={styles.actionCount}>View all</p>
                    </div>
                </Link>
            </div>

            {/* Recent Entries */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <div>
                        <h2 className={styles.cardTitle}>Recent Notes</h2>
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
                        <p className={styles.emptyTitle}>No notes yet</p>
                        <p className={styles.emptyText}>Record your first voice log to get started</p>
                    </div>
                ) : (
                    <div className={styles.entryList}>
                        {recentEntries.map((entry) => (
                            <div key={entry.id} className={styles.entryItem}>
                                <div className={styles.entryHeader}>
                                    <div className={styles.entryClientRow}>
                                        <span className={styles.entryClientName}>
                                            {entry.client_name || 'General Note'}
                                        </span>
                                        <span className={styles.entryTimestamp}>
                                            {formatSmartTimestamp(entry.created_at)}
                                        </span>
                                    </div>
                                    <span className={styles.entryMoodDot} title={entry.mood}>
                                        {getMoodEmoji(entry.mood)}
                                    </span>
                                </div>
                                <p className={styles.entryText}>
                                    {cleanNoteText(entry.formatted_summary || entry.summary || entry.processed_text || entry.raw_transcript || '')}
                                </p>
                                {entry.tags && entry.tags.length > 0 && (
                                    <div className={styles.entryTags}>
                                        {entry.tags.slice(0, 3).map((tag, i) => (
                                            <span key={i} className={styles.entryTag}>{tag}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
