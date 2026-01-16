'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Lock, Eye, EyeOff, Brain, CheckCircle, ArrowLeft, AlertTriangle, Mail } from 'lucide-react';
import styles from '../login/login.module.css';

export default function ResetPasswordPage() {
    const router = useRouter();
    const supabase = createClient();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [validSession, setValidSession] = useState<boolean | null>(null);

    // Use ref to track if password reset was successful (to prevent race condition)
    const resetCompletedRef = useRef(false);

    useEffect(() => {
        // Listen for auth state changes - Supabase will automatically
        // pick up the recovery token from the URL and create a session
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                // Don't update state if password reset was already completed
                if (resetCompletedRef.current) return;

                if (event === 'PASSWORD_RECOVERY') {
                    // User clicked the password reset link
                    setValidSession(true);
                } else if (event === 'SIGNED_IN' && session) {
                    // Session established from recovery token
                    setValidSession(true);
                } else if (event === 'SIGNED_OUT') {
                    // Only set invalid session if reset wasn't completed
                    if (!resetCompletedRef.current) {
                        setValidSession(false);
                    }
                }
            }
        );

        // Also check for existing session
        const checkSession = async () => {
            // Give Supabase a moment to process URL tokens
            await new Promise(resolve => setTimeout(resolve, 500));

            const { data: { session } } = await supabase.auth.getSession();

            // Check URL for recovery tokens
            const hash = window.location.hash;
            const searchParams = new URLSearchParams(window.location.search);

            // Supabase might put tokens in hash or search params depending on config
            const hasRecoveryToken = hash.includes('type=recovery') ||
                searchParams.get('type') === 'recovery' ||
                hash.includes('access_token');

            if (session) {
                setValidSession(true);
            } else if (hasRecoveryToken) {
                // Token exists but session not created yet - wait a bit more
                await new Promise(resolve => setTimeout(resolve, 1000));
                const { data: { session: retrySession } } = await supabase.auth.getSession();
                setValidSession(!!retrySession);
            } else {
                setValidSession(false);
            }
        };

        checkSession();

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase.auth]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate passwords match
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password length
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) {
                if (updateError.message.includes('session')) {
                    throw new Error('Your reset link has expired. Please request a new one.');
                }
                throw updateError;
            }

            // Mark reset as completed BEFORE signing out to prevent race condition
            resetCompletedRef.current = true;
            setSuccess(true);

            // Sign out silently
            await supabase.auth.signOut();

            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    // Loading state while checking session
    if (validSession === null) {
        return (
            <div className={styles.container}>
                <div className={styles.rightPanel}>
                    <div className={styles.formContainer}>
                        <div className={styles.card} style={{ textAlign: 'center', padding: '60px' }}>
                            <div className={styles.buttonSpinner} style={{ margin: '0 auto 16px auto' }}></div>
                            <p style={{ color: '#64748b' }}>Verifying reset link...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // IMPORTANT: Check success BEFORE checking validSession to prevent flash of "Link Expired"
    // This is the key fix for the race condition
    if (success) {
        return (
            <div className={styles.container}>
                <div className={`${styles.decorativeOrb} ${styles.orb1}`}></div>
                <div className={`${styles.decorativeOrb} ${styles.orb2}`}></div>

                <div className={styles.leftPanel}>
                    <div className={styles.leftPanelContent}>
                        <div className={styles.brandLogo}>
                            <div className={styles.logoIcon}>
                                <Brain size={32} />
                            </div>
                            <div>
                                <h1 className={styles.brandName}>CoachAlly</h1>
                                <p className={styles.brandTagline}>AI-Powered Field Reporting</p>
                            </div>
                        </div>

                        <h2 className={styles.heroTitle}>
                            Password<br />Updated!
                        </h2>
                        <p className={styles.heroSubtitle}>
                            Your password has been successfully changed.
                            You can now sign in with your new password.
                        </p>
                    </div>
                </div>

                <div className={styles.rightPanel}>
                    <div className={styles.formContainer}>
                        <div className={styles.mobileLogo}>
                            <div className={styles.mobileLogoIcon}>
                                <Brain size={36} />
                            </div>
                            <h1 className={styles.mobileLogoText}>
                                <span className={styles.mobileLogoGradient}>Coach</span>Ally
                            </h1>
                        </div>

                        <div className={styles.card}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 20px auto'
                                }}>
                                    <CheckCircle size={32} color="white" />
                                </div>
                                <h2 className={styles.cardTitle}>Password Reset!</h2>
                                <p className={styles.cardSubtitle} style={{ marginBottom: '24px' }}>
                                    Your password has been successfully updated.<br />
                                    Redirecting you to login...
                                </p>
                                <div className={styles.buttonSpinner} style={{
                                    margin: '0 auto',
                                    borderColor: 'rgba(2, 132, 199, 0.3)',
                                    borderTopColor: '#0284c7'
                                }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Invalid or expired session (only show if NOT successful)
    if (!validSession) {
        return (
            <div className={styles.container}>
                <div className={`${styles.decorativeOrb} ${styles.orb1}`}></div>
                <div className={`${styles.decorativeOrb} ${styles.orb2}`}></div>

                <div className={styles.rightPanel}>
                    <div className={styles.formContainer}>
                        <div className={styles.mobileLogo}>
                            <div className={styles.mobileLogoIcon}>
                                <Brain size={36} />
                            </div>
                            <h1 className={styles.mobileLogoText}>
                                <span className={styles.mobileLogoGradient}>Coach</span>Ally
                            </h1>
                        </div>

                        <div className={styles.card} style={{ textAlign: 'center' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                background: '#fef3c7',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px auto'
                            }}>
                                <AlertTriangle size={32} color="#d97706" />
                            </div>
                            <h2 className={styles.cardTitle}>Link Expired</h2>
                            <p className={styles.cardSubtitle} style={{ marginBottom: '24px' }}>
                                This password reset link has expired or is invalid.
                                Please request a new one.
                            </p>
                            <Link
                                href="/forgot-password"
                                className={styles.submitButton}
                                style={{ textDecoration: 'none', display: 'inline-flex' }}
                            >
                                <Mail size={20} />
                                <span>Request New Link</span>
                            </Link>
                            <div className={styles.footer}>
                                <Link
                                    href="/login"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        color: '#0284c7',
                                        textDecoration: 'none',
                                        fontSize: '14px',
                                        fontWeight: '600'
                                    }}
                                >
                                    <ArrowLeft size={16} />
                                    Back to Login
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Decorative Background Orbs */}
            <div className={`${styles.decorativeOrb} ${styles.orb1}`}></div>
            <div className={`${styles.decorativeOrb} ${styles.orb2}`}></div>

            {/* Left Panel - Branding (Desktop Only) */}
            <div className={styles.leftPanel}>
                <div className={styles.leftPanelContent}>
                    <div className={styles.brandLogo}>
                        <div className={styles.logoIcon}>
                            <Brain size={32} />
                        </div>
                        <div>
                            <h1 className={styles.brandName}>CoachAlly</h1>
                            <p className={styles.brandTagline}>AI-Powered Field Reporting</p>
                        </div>
                    </div>

                    <h2 className={styles.heroTitle}>
                        Create New<br />Password
                    </h2>
                    <p className={styles.heroSubtitle}>
                        Choose a strong password that you haven&apos;t used before.
                        We recommend using a mix of letters, numbers, and symbols.
                    </p>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className={styles.rightPanel}>
                <div className={styles.formContainer}>
                    {/* Mobile Logo */}
                    <div className={styles.mobileLogo}>
                        <div className={styles.mobileLogoIcon}>
                            <Brain size={36} />
                        </div>
                        <h1 className={styles.mobileLogoText}>
                            <span className={styles.mobileLogoGradient}>Coach</span>Ally
                        </h1>
                    </div>

                    {/* Card */}
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Reset Password</h2>
                        <p className={styles.cardSubtitle}>
                            Enter your new password below
                        </p>

                        <form onSubmit={handleSubmit} className={styles.form}>
                            {/* Password Field */}
                            <div className={styles.inputGroup}>
                                <label htmlFor="password" className={styles.inputLabel}>
                                    New Password
                                </label>
                                <div className={styles.inputWrapper}>
                                    <Lock size={20} className={styles.inputIcon} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className={`${styles.input} ${password ? styles.inputFilled : ''}`}
                                        placeholder="Enter new password"
                                        autoComplete="new-password"
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        className={styles.passwordToggle}
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password Field */}
                            <div className={styles.inputGroup}>
                                <label htmlFor="confirmPassword" className={styles.inputLabel}>
                                    Confirm Password
                                </label>
                                <div className={styles.inputWrapper}>
                                    <Lock size={20} className={styles.inputIcon} />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className={`${styles.input} ${confirmPassword ? styles.inputFilled : ''}`}
                                        placeholder="Confirm new password"
                                        autoComplete="new-password"
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        className={styles.passwordToggle}
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className={styles.errorContainer}>
                                    <div className={styles.errorIcon}>!</div>
                                    <p className={styles.errorText}>{error}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={styles.submitButton}
                            >
                                {loading ? (
                                    <>
                                        <div className={styles.buttonSpinner}></div>
                                        <span>Updating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Lock size={20} />
                                        <span>Update Password</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Back to Login */}
                        <div className={styles.footer}>
                            <Link
                                href="/login"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    color: '#0284c7',
                                    textDecoration: 'none',
                                    fontSize: '14px',
                                    fontWeight: '600'
                                }}
                            >
                                <ArrowLeft size={16} />
                                Back to Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
