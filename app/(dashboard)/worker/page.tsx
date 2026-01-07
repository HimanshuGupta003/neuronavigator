'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Mic, Clock, FileText, TrendingUp, Play, Square, MapPin } from 'lucide-react';
import { Profile, Shift, Entry } from '@/lib/types';

export default function WorkerDashboardPage() {
    const supabase = createClient();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [activeShift, setActiveShift] = useState<Shift | null>(null);
    const [recentEntries, setRecentEntries] = useState<Entry[]>([]);
    const [loading, setLoading] = useState(true);
    const [shiftLoading, setShiftLoading] = useState(false);

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileData) {
                setProfile(profileData as Profile);
            }

            // Get active shift (clocked in but not out)
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

            // Get recent entries
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

            // Get current location
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
            // Get current location
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

    const getShiftDuration = () => {
        if (!activeShift) return '0:00';
        const start = new Date(activeShift.clock_in_at);
        const now = new Date();
        const diff = now.getTime() - start.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}:${minutes.toString().padStart(2, '0')}`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'green': return 'bg-status-green';
            case 'yellow': return 'bg-status-yellow';
            case 'red': return 'bg-status-red';
            default: return 'bg-muted';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Welcome Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                    Welcome{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!
                </h1>
                <p className="text-muted mt-1">
                    {activeShift ? "You're currently on shift" : 'Start your shift to begin logging'}
                </p>
            </div>

            {/* Shift Toggle Card */}
            <Card padding="lg" className={activeShift ? 'border-status-green/30 bg-status-green-bg/20' : ''}>
                <CardContent>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${activeShift ? 'bg-status-green/20' : 'bg-muted-bg'
                                }`}>
                                <Clock className={`w-7 h-7 ${activeShift ? 'text-status-green' : 'text-muted'}`} />
                            </div>
                            <div>
                                <p className="text-sm text-muted">
                                    {activeShift ? 'Shift Duration' : 'Not Clocked In'}
                                </p>
                                <p className="text-3xl font-bold text-foreground">
                                    {activeShift ? getShiftDuration() : '--:--'}
                                </p>
                                {activeShift && (
                                    <p className="text-xs text-muted flex items-center gap-1 mt-1">
                                        <MapPin className="w-3 h-3" />
                                        Started at {new Date(activeShift.clock_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                )}
                            </div>
                        </div>
                        <Button
                            variant={activeShift ? 'danger' : 'primary'}
                            size="lg"
                            onClick={activeShift ? handleClockOut : handleClockIn}
                            loading={shiftLoading}
                            className="w-full sm:w-auto"
                        >
                            {activeShift ? (
                                <>
                                    <Square className="w-5 h-5" />
                                    Clock Out
                                </>
                            ) : (
                                <>
                                    <Play className="w-5 h-5" />
                                    Clock In
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
                <Card
                    hover
                    className="cursor-pointer"
                    onClick={() => window.location.href = '/worker/record'}
                >
                    <CardContent className="py-6 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                            <Mic className="w-7 h-7 text-primary" />
                        </div>
                        <p className="font-semibold text-foreground">Record Entry</p>
                        <p className="text-sm text-muted mt-1">Voice log</p>
                    </CardContent>
                </Card>

                <Card
                    hover
                    className="cursor-pointer"
                    onClick={() => window.location.href = '/worker/entries'}
                >
                    <CardContent className="py-6 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-status-green-bg flex items-center justify-center mx-auto mb-3">
                            <FileText className="w-7 h-7 text-status-green" />
                        </div>
                        <p className="font-semibold text-foreground">My Entries</p>
                        <p className="text-sm text-muted mt-1">View all</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Entries */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Entries</CardTitle>
                    <CardDescription>Your latest field logs</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-8 text-center text-muted">Loading...</div>
                    ) : recentEntries.length === 0 ? (
                        <div className="py-8 text-center">
                            <FileText className="w-12 h-12 text-muted mx-auto mb-3" />
                            <p className="text-muted">No entries yet</p>
                            <p className="text-sm text-muted/70 mt-1">
                                Record your first voice log to get started
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {recentEntries.map((entry) => (
                                <div key={entry.id} className="py-4 first:pt-0 last:pb-0">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-3 h-3 rounded-full mt-1.5 ${getStatusColor(entry.status)}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-foreground line-clamp-2">
                                                {entry.processed_text || entry.raw_transcript || 'No transcript available'}
                                            </p>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                                                <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                                                <span>{new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                {entry.client_name && <span>• {entry.client_name}</span>}
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
