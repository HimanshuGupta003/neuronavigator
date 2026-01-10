'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogIn, Shield, Brain, Mail, Lock, Sparkles, ArrowRight, Eye, EyeOff, Check } from 'lucide-react';
import styles from './login.module.css';

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

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
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                if (profile?.role === 'admin') {
                    router.push('/admin');
                } else {
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
                            <h1 className={styles.brandName}>NeuroNavigator</h1>
                            <p className={styles.brandTagline}>AI-Powered Field Reporting</p>
                        </div>
                    </div>

                    <h2 className={styles.heroTitle}>
                        Streamline Your<br />Field Operations
                    </h2>
                    <p className={styles.heroSubtitle}>
                        Empower your Job Coaches with intelligent note-taking,
                        real-time tracking, and automated report generation.
                    </p>

                    <div className={styles.featureList}>
                        <div className={styles.featureItem}>
                            <div className={styles.featureIcon}>
                                <Check size={18} />
                            </div>
                            <span>Voice-to-text notes with AI processing</span>
                        </div>
                        <div className={styles.featureItem}>
                            <div className={styles.featureIcon}>
                                <Check size={18} />
                            </div>
                            <span>Client tracking and mood monitoring</span>
                        </div>
                        <div className={styles.featureItem}>
                            <div className={styles.featureIcon}>
                                <Check size={18} />
                            </div>
                            <span>Automated monthly report generation</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className={styles.rightPanel}>
                <div className={styles.formContainer}>
                    {/* Mobile Logo */}
                    <div className={styles.mobileLogo}>
                        <div className={styles.mobileLogoIcon}>
                            <Brain size={36} />
                        </div>
                        <h1 className={styles.mobileLogoText}>
                            <span className={styles.mobileLogoGradient}>Neuro</span>Navigator
                        </h1>
                    </div>

                    {/* Card */}
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Welcome Back</h2>
                        <p className={styles.cardSubtitle}>
                            Sign in to access your dashboard
                        </p>

                        <form onSubmit={handleLogin} className={styles.form}>
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

                            {/* Password Field */}
                            <div className={styles.inputGroup}>
                                <label htmlFor="password" className={styles.inputLabel}>
                                    Password
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
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
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
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    <>
                                        <LogIn size={20} />
                                        <span>Sign In</span>
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Footer */}
                        <div className={styles.footer}>
                            <p className={styles.footerText}>
                                <Shield size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                Job Coaches must be invited by an administrator
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
