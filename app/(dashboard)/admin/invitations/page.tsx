'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserPlus, Copy, Check, Mail, Clock, Link2, Sparkles } from 'lucide-react';
import { Invitation } from '@/lib/types';
import styles from './invitations.module.css';

export default function InvitationsPage() {
    const supabase = createClient();
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState<{ link: string; emailSent: boolean } | null>(null);
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

            setSuccess({ link: data.data.invitationLink, emailSent: data.data.emailSent });
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
            return { label: 'Used', color: '#4ade80', bgColor: 'rgba(34, 197, 94, 0.15)', borderColor: 'rgba(34, 197, 94, 0.3)' };
        }
        const expires = new Date(inv.expires_at);
        if (expires < new Date()) {
            return { label: 'Expired', color: '#f87171', bgColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' };
        }
        return { label: 'Pending', color: '#fbbf24', bgColor: 'rgba(251, 191, 36, 0.15)', borderColor: 'rgba(251, 191, 36, 0.3)' };
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>Invitations</h1>
                <p className={styles.subtitle}>Invite workers to join the platform</p>
            </div>

            {/* Invite Form */}
            <div className={styles.card}>
                <h2 className={styles.cardTitle}>Invite New Worker</h2>
                <p className={styles.cardSubtitle}>Send an invitation link to a worker's email address</p>

                <form onSubmit={handleInvite} className={styles.inviteForm}>
                    <div className={styles.formRow}>
                        <input
                            type="email"
                            placeholder="Enter worker's email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className={styles.emailInput}
                        />
                        <button type="submit" disabled={sending} className={styles.sendButton}>
                            <Sparkles size={18} />
                            {sending ? 'Sending...' : 'Send Invitation'}
                        </button>
                    </div>

                    {error && (
                        <div className={styles.errorBox}>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className={styles.successBox}>
                            <p className={styles.successText}>
                                {success.emailSent
                                    ? '✓ Invitation email sent successfully!'
                                    : '✓ Invitation created! Share the link below with the worker:'}
                            </p>
                            <div className={styles.linkRow}>
                                <code className={styles.linkCode}>
                                    {success.link}
                                </code>
                                <button
                                    type="button"
                                    onClick={() => copyLink(success.link)}
                                    className={styles.copyButton}
                                >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>

            {/* Invitations List */}
            <div className={styles.card}>
                <h2 className={styles.cardTitle}>All Invitations</h2>
                <p className={styles.cardSubtitle}>History of all sent invitations</p>

                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                    </div>
                ) : invitations.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <Mail size={32} />
                        </div>
                        <p className={styles.emptyTitle}>No invitations sent yet</p>
                    </div>
                ) : (
                    <div className={styles.invitationList}>
                        {invitations.map((inv) => {
                            const status = getInvitationStatus(inv);
                            const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
                            const invLink = `${appUrl}/setup-credentials?token=${inv.token}`;

                            return (
                                <div key={inv.id} className={styles.invitationItem}>
                                    <div className={styles.invitationInfo}>
                                        <div className={styles.invitationIcon}>
                                            <Mail size={20} />
                                        </div>
                                        <div>
                                            <p className={styles.invitationEmail}>{inv.email}</p>
                                            <div className={styles.invitationMeta}>
                                                <Clock size={12} />
                                                <span>Expires: {new Date(inv.expires_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.invitationActions}>
                                        <span
                                            className={styles.statusBadge}
                                            style={{
                                                backgroundColor: status.bgColor,
                                                color: status.color,
                                                borderColor: status.borderColor
                                            }}
                                        >
                                            {status.label}
                                        </span>
                                        {status.label === 'Pending' && (
                                            <button
                                                onClick={() => copyLink(invLink)}
                                                className={styles.linkButton}
                                            >
                                                <Link2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
