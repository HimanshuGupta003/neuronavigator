'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, CheckCircle2, AlertCircle, User, Brain } from 'lucide-react';

function SetupCredentialsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const token = searchParams.get('token');

    const [step, setStep] = useState<'loading' | 'form' | 'success' | 'error'>('loading');
    const [invitation, setInvitation] = useState<{ email: string; id: string } | null>(null);
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) {
            setError('Invalid invitation link. Please contact your administrator.');
            setStep('error');
            return;
        }

        async function verifyToken() {
            try {
                const response = await fetch(`/api/auth/verify-invitation?token=${token}`);
                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Invalid or expired invitation');
                }

                setInvitation({ email: data.data.email, id: data.data.id });
                setStep('form');
            } catch (err) {
                console.error('Token verification error:', err);
                setError(err instanceof Error ? err.message : 'Failed to verify invitation');
                setStep('error');
            }
        }

        verifyToken();
    }, [token]);

    const handleSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/setup-credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    fullName,
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to create account');
            }

            setStep('success');

            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err) {
            console.error('Setup error:', err);
            setError(err instanceof Error ? err.message : 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    const cardStyle: React.CSSProperties = {
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '32px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        height: '48px',
        padding: '0 16px',
        fontSize: '16px',
        color: '#111827',
        backgroundColor: '#ffffff',
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        outline: 'none',
        boxSizing: 'border-box' as const,
        transition: 'border-color 0.15s ease'
    };

    if (step === 'loading') {
        return (
            <div style={cardStyle}>
                <div style={{ padding: '48px 0', textAlign: 'center' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid #6366f1',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px auto'
                    }} />
                    <p style={{ color: '#6b7280', fontSize: '15px' }}>Verifying invitation...</p>
                </div>
            </div>
        );
    }

    if (step === 'error') {
        return (
            <div style={cardStyle}>
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        backgroundColor: '#fef2f2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px auto'
                    }}>
                        <AlertCircle style={{ width: '32px', height: '32px', color: '#ef4444' }} />
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>
                        Invitation Error
                    </h2>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 24px 0' }}>{error}</p>
                    <button
                        onClick={() => router.push('/login')}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer'
                        }}
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div style={cardStyle}>
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        backgroundColor: '#f0fdf4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px auto'
                    }}>
                        <CheckCircle2 style={{ width: '32px', height: '32px', color: '#22c55e' }} />
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>
                        Account Created!
                    </h2>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                        Your account has been set up successfully.
                    </p>
                    <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '8px' }}>
                        Redirecting to login...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={cardStyle}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#111827', margin: 0 }}>
                    Set Up Your Account
                </h2>
                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                    Create your credentials to get started
                </p>
            </div>

            {/* Email badge */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                marginBottom: '24px',
                border: '1px solid #e5e7eb'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#eef2ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <User style={{ width: '20px', height: '20px', color: '#6366f1' }} />
                </div>
                <div>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Setting up account for</p>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827', margin: 0 }}>{invitation?.email}</p>
                </div>
            </div>

            <form onSubmit={handleSetup}>
                {/* Full Name */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        Full Name
                    </label>
                    <input
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        style={inputStyle}
                        onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                </div>

                {/* Password */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        Password
                    </label>
                    <input
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={inputStyle}
                        onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                    <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>At least 8 characters</p>
                </div>

                {/* Confirm Password */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        Confirm Password
                    </label>
                    <input
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        style={inputStyle}
                        onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
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
                        boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
                    }}
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
                            <KeyRound style={{ width: '20px', height: '20px' }} />
                            Create Account
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}

export default function SetupCredentialsPage() {
    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f3f4f6',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
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

            <div style={{ width: '100%', maxWidth: '420px' }}>
                <Suspense
                    fallback={
                        <div style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '16px',
                            padding: '48px 32px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                border: '3px solid #6366f1',
                                borderTopColor: 'transparent',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto'
                            }} />
                        </div>
                    }
                >
                    <SetupCredentialsContent />
                </Suspense>
            </div>

            <p style={{
                textAlign: 'center',
                fontSize: '14px',
                color: '#9ca3af',
                marginTop: '24px'
            }}>
                © {new Date().getFullYear()} NeuroNavigator. All rights reserved.
            </p>

            <style jsx global>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
