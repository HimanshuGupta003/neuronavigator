'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { UserPlus, Copy, Check, Mail, Clock, Trash2, Link2 } from 'lucide-react';
import { Invitation } from '@/lib/types';

export default function InvitationsPage() {
    const supabase = createClient();
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState<{ link: string } | null>(null);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadInvitations();
    }, []);

    async function loadInvitations() {
        try {
            const { data } = await supabase
                .from('invitations')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) {
                setInvitations(data as Invitation[]);
            }
        } catch (error) {
            console.error('Failed to load invitations:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        setError('');
        setSuccess(null);

        try {
            const response = await fetch('/api/auth/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to send invitation');
            }

            setSuccess({ link: data.data.invitationLink });
            setEmail('');
            loadInvitations();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send invitation');
        } finally {
            setSending(false);
        }
    };

    const copyLink = async (link: string) => {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getInvitationStatus = (inv: Invitation) => {
        if (inv.used_at) {
            return { label: 'Used', color: 'text-status-green', bg: 'bg-status-green-bg' };
        }
        const expires = new Date(inv.expires_at);
        if (expires < new Date()) {
            return { label: 'Expired', color: 'text-status-red', bg: 'bg-status-red-bg' };
        }
        return { label: 'Pending', color: 'text-status-yellow', bg: 'bg-status-yellow-bg' };
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Invitations</h1>
                <p className="text-muted mt-1">Invite workers to join the platform</p>
            </div>

            {/* Invite Form */}
            <Card padding="lg">
                <CardHeader>
                    <CardTitle>Invite New Worker</CardTitle>
                    <CardDescription>
                        Send an invitation link to a worker&apos;s email address
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleInvite} className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <Input
                                    type="email"
                                    placeholder="Enter worker's email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" loading={sending} className="sm:w-auto">
                                <UserPlus className="w-4 h-4" />
                                Send Invitation
                            </Button>
                        </div>

                        {error && (
                            <div className="p-4 bg-status-red-bg border border-status-red/20 rounded-xl">
                                <p className="text-sm text-status-red">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="p-4 bg-status-green-bg border border-status-green/20 rounded-xl">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-status-green mb-2">
                                            Invitation created successfully!
                                        </p>
                                        <p className="text-sm text-foreground truncate font-mono">
                                            {success.link}
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => copyLink(success.link)}
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        {copied ? 'Copied!' : 'Copy'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>

            {/* Invitations List */}
            <Card>
                <CardHeader>
                    <CardTitle>All Invitations</CardTitle>
                    <CardDescription>History of all sent invitations</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-8 text-center text-muted">Loading...</div>
                    ) : invitations.length === 0 ? (
                        <div className="py-8 text-center">
                            <Mail className="w-12 h-12 text-muted mx-auto mb-3" />
                            <p className="text-muted">No invitations sent yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {invitations.map((inv) => {
                                const status = getInvitationStatus(inv);
                                const appUrl = typeof window !== 'undefined'
                                    ? window.location.origin
                                    : 'http://localhost:3000';
                                const invLink = `${appUrl}/setup-credentials?token=${inv.token}`;

                                return (
                                    <div key={inv.id} className="py-4 first:pt-0 last:pb-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-muted-bg flex items-center justify-center">
                                                    <Mail className="w-5 h-5 text-muted" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">{inv.email}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted">
                                                        <Clock className="w-3 h-3" />
                                                        <span>
                                                            Expires: {new Date(inv.expires_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 pl-13 sm:pl-0">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                                                    {status.label}
                                                </span>
                                                {status.label === 'Pending' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyLink(invLink)}
                                                    >
                                                        <Link2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
