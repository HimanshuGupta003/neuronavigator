'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
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
            case 'green': return 'bg-[#22c55e]';
            case 'yellow': return 'bg-[#eab308]';
            case 'red': return 'bg-[#ef4444]';
            default: return 'bg-[#94a3b8]';
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-[#0f172a]">
                    Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
                </h1>
                <p className="text-sm text-[#64748b] mt-1">
                    {activeShift ? "You're currently clocked in" : 'Clock in to start your shift'}
                </p>
            </div>

            {/* Shift Timer Card */}
            <Card className={activeShift ? 'border-[#22c55e] bg-[rgba(34,197,94,0.03)]' : ''}>
                <CardContent>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center
                ${activeShift ? 'bg-[#22c55e]' : 'bg-[#f1f5f9]'}
              `}>
                                <Clock className={`w-6 h-6 ${activeShift ? 'text-white' : 'text-[#64748b]'}`} />
                            </div>
                            <div>
                                <p className="text-sm text-[#64748b]">
                                    {activeShift ? 'Shift Duration' : 'Not Clocked In'}
                                </p>
                                <p className="text-2xl sm:text-3xl font-bold text-[#0f172a] font-mono">
                                    {activeShift ? shiftDuration : '--:--:--'}
                                </p>
                                {activeShift && (
                                    <p className="text-xs text-[#64748b] flex items-center gap-1 mt-1">
                                        <MapPin className="w-3 h-3" />
                                        Started at {new Date(activeShift.clock_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                )}
                            </div>
                        </div>

                        <Button
                            variant={activeShift ? 'danger' : 'success'}
                            size="lg"
                            onClick={activeShift ? handleClockOut : handleClockIn}
                            loading={shiftLoading}
                            className="w-full sm:w-auto"
                        >
                            {activeShift ? (
                                <>
                                    <Square className="w-4 h-4" />
                                    Clock Out
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4" />
                                    Clock In
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
                <Link href="/worker/record">
                    <Card hover className="h-full">
                        <CardContent className="flex flex-col items-center py-6 text-center">
                            <div className="w-12 h-12 rounded-xl bg-[#6366f1] flex items-center justify-center mb-3">
                                <Mic className="w-6 h-6 text-white" />
                            </div>
                            <p className="font-medium text-[#0f172a]">Record Entry</p>
                            <p className="text-xs text-[#64748b] mt-0.5">Voice log</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/worker/entries">
                    <Card hover className="h-full">
                        <CardContent className="flex flex-col items-center py-6 text-center">
                            <div className="w-12 h-12 rounded-xl bg-[#22c55e] flex items-center justify-center mb-3">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <p className="font-medium text-[#0f172a]">My Entries</p>
                            <p className="text-xs text-[#64748b] mt-0.5">View all</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Recent Entries */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Recent Entries</CardTitle>
                            <CardDescription>Your latest field logs</CardDescription>
                        </div>
                        {recentEntries.length > 0 && (
                            <Link href="/worker/entries">
                                <Button variant="ghost" size="sm">View All</Button>
                            </Link>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-8 text-center">
                            <div className="w-6 h-6 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-sm text-[#64748b]">Loading...</p>
                        </div>
                    ) : recentEntries.length === 0 ? (
                        <div className="py-8 text-center">
                            <div className="w-12 h-12 rounded-xl bg-[#f1f5f9] flex items-center justify-center mx-auto mb-3">
                                <AlertCircle className="w-6 h-6 text-[#94a3b8]" />
                            </div>
                            <p className="font-medium text-[#334155]">No entries yet</p>
                            <p className="text-sm text-[#64748b] mt-1">
                                Record your first voice log to get started
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentEntries.map((entry) => (
                                <div
                                    key={entry.id}
                                    className="p-3 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${getStatusColor(entry.status)}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-[#334155] line-clamp-2">
                                                {entry.processed_text || entry.raw_transcript || 'No transcript available'}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2 text-xs text-[#64748b]">
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
                </CardContent>
            </Card>
        </div>
    );
}
