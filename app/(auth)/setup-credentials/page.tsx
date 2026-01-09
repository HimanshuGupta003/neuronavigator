'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, CheckCircle2, AlertCircle, User, Brain, ArrowRight } from 'lucide-react';

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
        backgroundColor: '#0a0a0a',
        borderRadius: '20px',
        padding: '36px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        height: '52px',
        padding: '0 18px',
        fontSize: '16px',
        fontWeight: 500,
        color: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        border: '1.5px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        outline: 'none',
        boxSizing: 'border-box' as const,
        transition: 'all 0.2s ease'
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
                    <p style={{ color: '#737373', fontSize: '15px' }}>Verifying invitation...</p>
                </div>
            </div>
        );
    }

    if (step === 'error') {
        return (
            <div style={cardStyle}>
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <div style={{
                        width: '68px',
                        height: '68px',
                        borderRadius: '18px',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px auto',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                        <AlertCircle style={{ width: '34px', height: '34px', color: '#f87171' }} />
                    </div>
                    <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#ffffff', margin: '0 0 10px 0' }}>
                        Invitation Error
                    </h2>
                    <p style={{ fontSize: '14px', color: '#737373', margin: '0 0 28px 0' }}>{error}</p>
                    <button
                        onClick={() => router.push('/login')}
                        style={{
                            padding: '14px 28px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: '#e5e5e5',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
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
                        width: '68px',
                        height: '68px',
                        borderRadius: '18px',
                        backgroundColor: 'rgba(34, 197, 94, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px auto',
                        border: '1px solid rgba(34, 197, 94, 0.2)'
                    }}>
                        <CheckCircle2 style={{ width: '34px', height: '34px', color: '#4ade80' }} />
                    </div>
                    <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#ffffff', margin: '0 0 10px 0' }}>
                        Account Created!
                    </h2>
                    <p style={{ fontSize: '14px', color: '#a3a3a3', margin: 0 }}>
                        Your account has been set up successfully.
                    </p>
                    <p style={{ fontSize: '13px', color: '#525252', marginTop: '12px' }}>
                        Redirecting to login...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={cardStyle}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#ffffff', margin: 0 }}>
                    Set Up Your Account
                </h2>
                <p style={{ fontSize: '14px', color: '#737373', marginTop: '8px' }}>
                    Create your credentials to get started
                </p>
            </div>

            {/* Email badge */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '16px 18px',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderRadius: '14px',
                marginBottom: '28px',
                border: '1px solid rgba(99, 102, 241, 0.2)'
            }}>
                <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <User style={{ width: '22px', height: '22px', color: 'white' }} />
                </div>
                <div>
                    <p style={{ fontSize: '12px', color: '#737373', margin: 0 }}>Setting up account for</p>
                    <p style={{ fontSize: '15px', fontWeight: '500', color: '#ffffff', margin: 0 }}>{invitation?.email}</p>
                </div>
            </div>

            <form onSubmit={handleSetup}>
                {/* Full Name */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#e5e5e5', marginBottom: '10px' }}>
                        Full Name
                    </label>
                    <input
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        style={inputStyle}
                        onFocus={(e) => {
                            e.target.style.borderColor = '#6366f1';
                            e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.2)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                </div>

                {/* Password */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#e5e5e5', marginBottom: '10px' }}>
                        Password
                    </label>
                    <input
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={inputStyle}
                        onFocus={(e) => {
                            e.target.style.borderColor = '#6366f1';
                            e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.2)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                    <p style={{ fontSize: '12px', color: '#525252', marginTop: '8px' }}>At least 8 characters</p>
                </div>

                {/* Confirm Password */}
                <div style={{ marginBottom: '28px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#e5e5e5', marginBottom: '10px' }}>
                        Confirm Password
                    </label>
                    <input
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        style={inputStyle}
                        onFocus={(e) => {
                            e.target.style.borderColor = '#6366f1';
                            e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.2)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                </div>

                {/* Error */}
                {error && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '14px 16px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '12px',
                        marginBottom: '20px'
                    }}>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(239, 68, 68, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: '700',
                            color: '#f87171',
                            flexShrink: 0
                        }}>!</div>
                        <p style={{ fontSize: '14px', color: '#f87171', margin: 0 }}>{error}</p>
                    </div>
                )}

                {/* Button */}
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: '100%',
                        height: '54px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '600',
                        border: 'none',
                        borderRadius: '14px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
                        opacity: loading ? 0.7 : 1,
                        transition: 'all 0.2s ease'
                    }}
                >
                    {loading ? (
                        <div style={{
                            width: '22px',
                            height: '22px',
                            border: '2px solid rgba(255, 255, 255, 0.3)',
                            borderTopColor: 'white',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                    ) : (
                        <>
                            <KeyRound style={{ width: '20px', height: '20px' }} />
                            Create Account
                            <ArrowRight style={{ width: '18px', height: '18px' }} />
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
            backgroundColor: '#000000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background gradient orbs */}
            <div style={{
                position: 'absolute',
                width: '500px',
                height: '500px',
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)',
                borderRadius: '50%',
                top: '-200px',
                right: '-100px',
                filter: 'blur(40px)'
            }} />
            <div style={{
                position: 'absolute',
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
                borderRadius: '50%',
                bottom: '-150px',
                left: '-100px',
                filter: 'blur(40px)'
            }} />

            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: '36px', position: 'relative', zIndex: 10 }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '70px',
                    height: '70px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                    borderRadius: '20px',
                    marginBottom: '18px',
                    boxShadow: '0 10px 40px rgba(99, 102, 241, 0.4)'
                }}>
                    <Brain style={{ width: '36px', height: '36px', color: 'white' }} />
                </div>
                <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                    <span style={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>Neuro</span>Navigator
                </h1>
                <p style={{ fontSize: '14px', color: '#737373', marginTop: '6px' }}>
                    AI-Powered Field Reporting
                </p>
            </div>

            <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 10 }}>
                <Suspense
                    fallback={
                        <div style={{
                            backgroundColor: '#0a0a0a',
                            borderRadius: '20px',
                            padding: '56px 36px',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
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
                color: 'rgba(255, 255, 255, 0.3)',
                marginTop: '32px',
                position: 'relative',
                zIndex: 10
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
