'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogIn, Shield, Brain } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            if (data.user) {
                console.log('User logged in:', data.user.id);

                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                console.log('Profile data:', profile);
                console.log('Profile error:', profileError);
                console.log('Role:', profile?.role);

                if (profile?.role === 'admin') {
                    console.log('Redirecting to /admin');
                    router.push('/admin');
                } else {
                    console.log('Redirecting to /worker');
                    router.push('/worker');
                }
                router.refresh();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{ width: '100%', maxWidth: '400px' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '64px',
                        height: '64px',
                        backgroundColor: '#6366f1',
                        borderRadius: '16px',
                        marginBottom: '16px',
                        boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)'
                    }}>
                        <Brain style={{ width: '32px', height: '32px', color: 'white' }} />
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
                        NeuroNavigator
                    </h1>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                        AI-Powered Field Reporting
                    </p>
                </div>

                {/* Card */}
                <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    padding: '32px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #e5e7eb'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>
                            Welcome Back
                        </h2>
                        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                            Sign in to access your dashboard
                        </p>
                    </div>

                    <form onSubmit={handleLogin}>
                        {/* Email Field */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#374151',
                                marginBottom: '8px'
                            }}>
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                                style={{
                                    width: '100%',
                                    height: '48px',
                                    padding: '0 16px',
                                    fontSize: '16px',
                                    color: '#111827',
                                    backgroundColor: '#ffffff',
                                    border: '2px solid #d1d5db',
                                    borderRadius: '12px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'border-color 0.15s ease'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                            />
                        </div>

                        {/* Password Field */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#374151',
                                marginBottom: '8px'
                            }}>
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                style={{
                                    width: '100%',
                                    height: '48px',
                                    padding: '0 16px',
                                    fontSize: '16px',
                                    color: '#111827',
                                    backgroundColor: '#ffffff',
                                    border: '2px solid #d1d5db',
                                    borderRadius: '12px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'border-color 0.15s ease'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div style={{
                                padding: '12px 16px',
                                backgroundColor: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: '12px',
                                marginBottom: '20px'
                            }}>
                                <p style={{ fontSize: '14px', color: '#dc2626', margin: 0 }}>{error}</p>
                            </div>
                        )}

                        {/* Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                height: '48px',
                                backgroundColor: loading ? '#a5b4fc' : '#6366f1',
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: '600',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                                transition: 'background-color 0.15s ease'
                            }}
                            onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#4f46e5')}
                            onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#6366f1')}
                        >
                            {loading ? (
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    border: '2px solid white',
                                    borderTopColor: 'transparent',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }} />
                            ) : (
                                <>
                                    <LogIn style={{ width: '20px', height: '20px' }} />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer info */}
                    <div style={{
                        marginTop: '24px',
                        paddingTop: '24px',
                        borderTop: '1px solid #e5e7eb'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: '14px',
                            color: '#6b7280'
                        }}>
                            <Shield style={{ width: '16px', height: '16px' }} />
                            <span>Secure B2B access only</span>
                        </div>
                        <p style={{
                            fontSize: '12px',
                            color: '#9ca3af',
                            textAlign: 'center',
                            marginTop: '8px'
                        }}>
                            Workers must be invited by an administrator
                        </p>
                    </div>
                </div>

                {/* Copyright */}
                <p style={{
                    textAlign: 'center',
                    fontSize: '14px',
                    color: '#9ca3af',
                    marginTop: '24px'
                }}>
                    © {new Date().getFullYear()} NeuroNavigator. All rights reserved.
                </p>
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
