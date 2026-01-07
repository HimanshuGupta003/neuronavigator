'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Users, Mail, Calendar, MoreVertical } from 'lucide-react';
import { Profile } from '@/lib/types';

export default function WorkersPage() {
    const supabase = createClient();
    const [workers, setWorkers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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

        loadWorkers();
    }, [supabase]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Workers</h1>
                <p className="text-muted mt-1">View and manage all field workers</p>
            </div>

            {/* Workers List */}
            <Card>
                <CardHeader>
                    <CardTitle>All Workers ({workers.length})</CardTitle>
                    <CardDescription>Complete list of registered field workers</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-8 text-center text-muted">Loading...</div>
                    ) : workers.length === 0 ? (
                        <div className="py-12 text-center">
                            <Users className="w-16 h-16 text-muted mx-auto mb-4" />
                            <p className="text-lg font-medium text-foreground mb-2">No workers yet</p>
                            <p className="text-muted">
                                Invite workers from the Invitations page to get started
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="px-4 py-3 text-left text-sm font-medium text-muted">Worker</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-muted hidden sm:table-cell">Email</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-muted hidden md:table-cell">Joined</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium text-muted">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {workers.map((worker) => (
                                        <tr key={worker.id} className="hover:bg-muted-bg/50 transition-colors">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-sm font-bold text-primary">
                                                            {worker.full_name?.charAt(0) || worker.email.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-foreground truncate">
                                                            {worker.full_name || 'Unnamed Worker'}
                                                        </p>
                                                        <p className="text-sm text-muted truncate sm:hidden">
                                                            {worker.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 hidden sm:table-cell">
                                                <div className="flex items-center gap-2 text-muted">
                                                    <Mail className="w-4 h-4 flex-shrink-0" />
                                                    <span className="truncate">{worker.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 hidden md:table-cell">
                                                <div className="flex items-center gap-2 text-muted">
                                                    <Calendar className="w-4 h-4 flex-shrink-0" />
                                                    <span>{new Date(worker.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <button className="p-2 rounded-lg hover:bg-muted-bg transition-colors text-muted hover:text-foreground">
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
