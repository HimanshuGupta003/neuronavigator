'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mic, Clock, FileText, Play, Square, MapPin, AlertCircle } from 'lucide-react';
import { Profile, Shift, Entry } from '@/lib/types';
import Link from 'next/link';

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
            case 'green': return '#22c55e';
            case 'yellow': return '#eab308';
            case 'red': return '#ef4444';
            default: return '#94a3b8';
        }
    };

    const cardStyle: React.CSSProperties = {
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    };

    return (
        <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
            {/* Page Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: 0 }}>
                    Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!
                </h1>
                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                    {activeShift ? "You're currently clocked in" : 'Clock in to start your shift'}
                </p>
            </div>

            {/* Shift Timer Card */}
            <div style={{
                ...cardStyle,
                marginBottom: '24px',
                borderColor: activeShift ? '#22c55e' : '#e5e7eb',
                backgroundColor: activeShift ? '#f0fdf4' : '#ffffff'
            }}>
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '20px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '14px',
                            backgroundColor: activeShift ? '#22c55e' : '#f3f4f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Clock style={{ width: '28px', height: '28px', color: activeShift ? 'white' : '#6b7280' }} />
                        </div>
                        <div>
                            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                                {activeShift ? 'Shift Duration' : 'Not Clocked In'}
                            </p>
                            <p style={{ fontSize: '32px', fontWeight: '700', color: '#111827', margin: '4px 0 0 0', fontFamily: 'monospace' }}>
                                {activeShift ? shiftDuration : '--:--:--'}
                            </p>
                            {activeShift && (
                                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <MapPin style={{ width: '12px', height: '12px' }} />
                                    Started at {new Date(activeShift.clock_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={activeShift ? handleClockOut : handleClockIn}
                        disabled={shiftLoading}
                        style={{
                            height: '48px',
                            padding: '0 24px',
                            backgroundColor: activeShift ? '#ef4444' : '#22c55e',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: '600',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: shiftLoading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            opacity: shiftLoading ? 0.7 : 1,
                            boxShadow: activeShift ? '0 4px 14px rgba(239, 68, 68, 0.3)' : '0 4px 14px rgba(34, 197, 94, 0.3)'
                        }}
                    >
                        {shiftLoading ? (
                            <div style={{ width: '20px', height: '20px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        ) : activeShift ? (
                            <>
                                <Square style={{ width: '18px', height: '18px' }} />
                                Clock Out
                            </>
                        ) : (
                            <>
                                <Play style={{ width: '18px', height: '18px' }} />
                                Clock In
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <Link href="/worker/record" style={{ textDecoration: 'none' }}>
                    <div style={{ ...cardStyle, textAlign: 'center', cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '14px',
                            backgroundColor: '#6366f1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px auto'
                        }}>
                            <Mic style={{ width: '28px', height: '28px', color: 'white' }} />
                        </div>
                        <p style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>Record Entry</p>
                        <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Voice log</p>
                    </div>
                </Link>

                <Link href="/worker/entries" style={{ textDecoration: 'none' }}>
                    <div style={{ ...cardStyle, textAlign: 'center', cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '14px',
                            backgroundColor: '#22c55e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px auto'
                        }}>
                            <FileText style={{ width: '28px', height: '28px', color: 'white' }} />
                        </div>
                        <p style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>My Entries</p>
                        <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>View all</p>
                    </div>
                </Link>
            </div>

            {/* Recent Entries */}
            <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>Recent Entries</h2>
                        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '2px' }}>Your latest field logs</p>
                    </div>
                    {recentEntries.length > 0 && (
                        <Link href="/worker/entries" style={{
                            fontSize: '14px',
                            color: '#6366f1',
                            textDecoration: 'none',
                            fontWeight: '500'
                        }}>
                            View All
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
                            margin: '0 auto 12px auto'
                        }} />
                        <p style={{ fontSize: '14px', color: '#6b7280' }}>Loading...</p>
                    </div>
                ) : recentEntries.length === 0 ? (
                    <div style={{ padding: '40px 0', textAlign: 'center' }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '14px',
                            backgroundColor: '#f3f4f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px auto'
                        }}>
                            <AlertCircle style={{ width: '28px', height: '28px', color: '#9ca3af' }} />
                        </div>
                        <p style={{ fontSize: '16px', fontWeight: '500', color: '#374151', margin: 0 }}>No entries yet</p>
                        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                            Record your first voice log to get started
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {recentEntries.map((entry) => (
                            <div
                                key={entry.id}
                                style={{
                                    padding: '16px',
                                    borderRadius: '12px',
                                    backgroundColor: '#f9fafb',
                                    border: '1px solid #e5e7eb'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                    <div style={{
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        backgroundColor: getStatusColor(entry.status),
                                        marginTop: '6px',
                                        flexShrink: 0
                                    }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{
                                            fontSize: '14px',
                                            color: '#374151',
                                            margin: 0,
                                            lineHeight: '1.5',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical'
                                        }}>
                                            {entry.processed_text || entry.raw_transcript || 'No transcript available'}
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                                            <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span>{new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            {entry.client_name && (
                                                <>
                                                    <span>•</span>
                                                    <span>{entry.client_name}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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
