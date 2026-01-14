'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Mail, ArrowLeft, Brain, CheckCircle } from 'lucide-react';
import styles from '../login/login.module.css';

export default function ForgotPasswordPage() {
    const supabase = createClient();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (resetError) throw resetError;

            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

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
                        Reset Your<br />Password
                    </h2>
                    <p className={styles.heroSubtitle}>
                        Don&apos;t worry, it happens to the best of us.
                        Enter your email and we&apos;ll send you a link to reset your password.
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
                        {success ? (
                            // Success State
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
                                <h2 className={styles.cardTitle}>Check Your Email</h2>
                                <p className={styles.cardSubtitle} style={{ marginBottom: '24px' }}>
                                    We&apos;ve sent a password reset link to<br />
                                    <strong style={{ color: '#1e293b' }}>{email}</strong>
                                </p>
                                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
                                    Didn&apos;t receive the email? Check your spam folder or try again.
                                </p>
                                <Link
                                    href="/login"
                                    className={styles.submitButton}
                                    style={{ textDecoration: 'none', display: 'inline-flex' }}
                                >
                                    <ArrowLeft size={20} />
                                    <span>Back to Login</span>
                                </Link>
                            </div>
                        ) : (
                            // Form State
                            <>
                                <h2 className={styles.cardTitle}>Forgot Password?</h2>
                                <p className={styles.cardSubtitle}>
                                    Enter your email address and we&apos;ll send you a link to reset your password
                                </p>

                                <form onSubmit={handleSubmit} className={styles.form}>
                                    {/* Email Field */}
                                    <div className={styles.inputGroup}>
                                        <label htmlFor="email" className={styles.inputLabel}>
                                            Email Address
                                        </label>
                                        <div className={styles.inputWrapper}>
                                            <Mail size={20} className={styles.inputIcon} />
                                            <input
                                                type="email"
                                                id="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className={`${styles.input} ${email ? styles.inputFilled : ''}`}
                                                placeholder="Enter your email"
                                                autoComplete="email"
                                            />
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
                                                <span>Sending...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Mail size={20} />
                                                <span>Send Reset Link</span>
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
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
