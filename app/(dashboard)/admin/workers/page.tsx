'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, Search, Clock, UserPlus } from 'lucide-react';
import { Profile } from '@/lib/types';
import Link from 'next/link';

export default function WorkersPage() {
    const supabase = createClient();
    const [workers, setWorkers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadWorkers();
    }, []);

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

    const filteredWorkers = workers.filter(w =>
        w.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        w.email.toLowerCase().includes(search.toLowerCase())
    );

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>Workers</h1>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Manage all registered workers</p>
                </div>
                <Link href="/admin/invitations" style={{ textDecoration: 'none' }}>
                    <button style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        backgroundColor: '#6366f1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}>
                        <UserPlus style={{ width: '18px', height: '18px' }} />
                        Invite Worker
                    </button>
                </Link>
            </div>

            {/* Workers Card */}
            <div style={cardStyle}>
                {/* Search */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search style={{
                            position: 'absolute',
                            left: '14px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '18px',
                            height: '18px',
                            color: '#9ca3af'
                        }} />
                        <input
                            type="text"
                            placeholder="Search workers..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: '100%',
                                height: '44px',
                                paddingLeft: '44px',
                                paddingRight: '14px',
                                fontSize: '14px',
                                border: '2px solid #e5e7eb',
                                borderRadius: '10px',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                    </div>
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
                            margin: '0 auto'
                        }} />
                    </div>
                ) : filteredWorkers.length === 0 ? (
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
                            <Users style={{ width: '28px', height: '28px', color: '#9ca3af' }} />
                        </div>
                        <p style={{ fontSize: '15px', fontWeight: '500', color: '#374151', margin: 0 }}>
                            {search ? 'No workers found' : 'No workers yet'}
                        </p>
                        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                            {search ? 'Try a different search term' : 'Invite workers to get started'}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {filteredWorkers.map((worker) => (
                            <div key={worker.id} style={{
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
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '50%',
                                        backgroundColor: '#6366f1',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: '600',
                                        fontSize: '16px'
                                    }}>
                                        {worker.full_name?.charAt(0) || worker.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '15px', fontWeight: '500', color: '#111827', margin: 0 }}>
                                            {worker.full_name || 'Unnamed'}
                                        </p>
                                        <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 0 0' }}>{worker.email}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280' }}>
                                    <Clock style={{ width: '14px', height: '14px' }} />
                                    Joined {new Date(worker.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Count */}
                {!loading && filteredWorkers.length > 0 && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                        <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                            Showing {filteredWorkers.length} of {workers.length} workers
                        </p>
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
