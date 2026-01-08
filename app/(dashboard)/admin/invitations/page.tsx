'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserPlus, Copy, Check, Mail, Clock, Link2 } from 'lucide-react';
import { Invitation } from '@/lib/types';

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
            return { label: 'Used', color: '#22c55e', bgColor: '#f0fdf4', borderColor: '#bbf7d0' };
        }
        const expires = new Date(inv.expires_at);
        if (expires < new Date()) {
            return { label: 'Expired', color: '#ef4444', bgColor: '#fef2f2', borderColor: '#fecaca' };
        }
        return { label: 'Pending', color: '#f59e0b', bgColor: '#fffbeb', borderColor: '#fde68a' };
    };

    const cardStyle: React.CSSProperties = {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    };

    return (
        <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>Invitations</h1>
                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Invite workers to join the platform</p>
            </div>

            {/* Invite Form */}
            <div style={{ ...cardStyle, marginBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 4px 0' }}>Invite New Worker</h2>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 20px 0' }}>Send an invitation link to a worker's email address</p>

                <form onSubmit={handleInvite}>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <input
                            type="email"
                            placeholder="Enter worker's email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                flex: '1',
                                minWidth: '200px',
                                height: '44px',
                                padding: '0 14px',
                                fontSize: '14px',
                                border: '2px solid #e5e7eb',
                                borderRadius: '10px',
                                outline: 'none',
                                transition: 'border-color 0.15s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                        <button
                            type="submit"
                            disabled={sending}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                height: '44px',
                                padding: '0 20px',
                                backgroundColor: sending ? '#a5b4fc' : '#6366f1',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: sending ? 'not-allowed' : 'pointer'
                            }}
                        >
                            <UserPlus style={{ width: '18px', height: '18px' }} />
                            {sending ? 'Sending...' : 'Send Invitation'}
                        </button>
                    </div>

                    {error && (
                        <div style={{
                            marginTop: '16px',
                            padding: '12px 16px',
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '10px',
                            color: '#dc2626',
                            fontSize: '14px'
                        }}>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div style={{
                            marginTop: '16px',
                            padding: '16px',
                            backgroundColor: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: '10px'
                        }}>
                            <p style={{ fontSize: '14px', fontWeight: '500', color: '#16a34a', margin: '0 0 8px 0' }}>
                                {success.emailSent
                                    ? '✓ Invitation email sent successfully!'
                                    : '✓ Invitation created! Share the link below with the worker:'}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <code style={{
                                    flex: 1,
                                    padding: '10px 12px',
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    color: '#374151',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {success.link}
                                </code>
                                <button
                                    type="button"
                                    onClick={() => copyLink(success.link)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '10px 16px',
                                        backgroundColor: '#f3f4f6',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        color: '#374151'
                                    }}
                                >
                                    {copied ? <Check style={{ width: '16px', height: '16px' }} /> : <Copy style={{ width: '16px', height: '16px' }} />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>

            {/* Invitations List */}
            <div style={cardStyle}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 4px 0' }}>All Invitations</h2>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 20px 0' }}>History of all sent invitations</p>

                {loading ? (
                    <div style={{ padding: '40px 0', textAlign: 'center' }}>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            border: '3px solid #6366f1',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto'
                        }} />
                    </div>
                ) : invitations.length === 0 ? (
                    <div style={{ padding: '40px 0', textAlign: 'center' }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '12px',
                            backgroundColor: '#f3f4f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px auto'
                        }}>
                            <Mail style={{ width: '28px', height: '28px', color: '#9ca3af' }} />
                        </div>
                        <p style={{ fontSize: '15px', fontWeight: '500', color: '#374151', margin: 0 }}>No invitations sent yet</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {invitations.map((inv) => {
                            const status = getInvitationStatus(inv);
                            const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
                            const invLink = `${appUrl}/setup-credentials?token=${inv.token}`;

                            return (
                                <div key={inv.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '14px 16px',
                                    backgroundColor: '#f9fafb',
                                    borderRadius: '10px',
                                    border: '1px solid #e5e7eb',
                                    gap: '12px',
                                    flexWrap: 'wrap'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '200px' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            backgroundColor: '#f3f4f6',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <Mail style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827', margin: 0 }}>{inv.email}</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                                <Clock style={{ width: '12px', height: '12px', color: '#9ca3af' }} />
                                                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                                    Expires: {new Date(inv.expires_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            backgroundColor: status.bgColor,
                                            color: status.color,
                                            border: `1px solid ${status.borderColor}`
                                        }}>
                                            {status.label}
                                        </span>
                                        {status.label === 'Pending' && (
                                            <button
                                                onClick={() => copyLink(invLink)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '36px',
                                                    height: '36px',
                                                    backgroundColor: '#ffffff',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <Link2 style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
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
