'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogIn, Shield, Brain, Mail, Lock, Sparkles, ArrowRight, Eye, EyeOff } from 'lucide-react';
import styles from './login.module.css';

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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
        <div className={styles.container}>
            {/* Animated Background */}
            <div className={styles.background}>
                <div className={styles.gradientOrb1}></div>
                <div className={styles.gradientOrb2}></div>
                <div className={styles.gradientOrb3}></div>
                <div className={styles.gridOverlay}></div>
            </div>

            {/* Floating Particles */}
            <div className={styles.particles}>
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className={styles.particle}
                        style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${15 + Math.random() * 10}s`
                        }}
                    />
                ))}
            </div>

            {/* Main Content */}
            <div className={`${styles.content} ${mounted ? styles.mounted : ''}`}>
                {/* Left Side - Branding */}
                <div className={styles.brandingSide}>
                    <div className={styles.brandingContent}>
                        <div className={styles.logoContainer}>
                            <div className={styles.logoRing}>
                                <div className={styles.logoRingInner}></div>
                            </div>
                            <div className={styles.logoIcon}>
                                <Brain className={styles.brainIcon} />
                            </div>
                            <div className={styles.logoPulse}></div>
                        </div>

                        <h1 className={styles.brandTitle}>
                            <span className={styles.brandGradient}>Neuro</span>Navigator
                        </h1>
                        <p className={styles.brandSubtitle}>
                            AI-Powered Field Reporting & Analytics
                        </p>

                        <div className={styles.featureList}>
                            <div className={styles.featureItem}>
                                <div className={styles.featureIcon}>
                                    <Sparkles size={18} />
                                </div>
                                <span>Intelligent Report Generation</span>
                            </div>
                            <div className={styles.featureItem}>
                                <div className={styles.featureIcon}>
                                    <Shield size={18} />
                                </div>
                                <span>Enterprise-Grade Security</span>
                            </div>
                            <div className={styles.featureItem}>
                                <div className={styles.featureIcon}>
                                    <Brain size={18} />
                                </div>
                                <span>Neural Processing Engine</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className={styles.formSide}>
                    <div className={styles.glassCard}>
                        <div className={styles.cardGlow}></div>

                        <div className={styles.formHeader}>
                            <h2 className={styles.formTitle}>Welcome Back</h2>
                            <p className={styles.formSubtitle}>
                                Sign in to access your intelligent dashboard
                            </p>
                        </div>

                        <form onSubmit={handleLogin} className={styles.form}>
                            {/* Email Field */}
                            <div className={`${styles.inputGroup} ${focusedField === 'email' ? styles.focused : ''} ${email ? styles.hasFilled : ''}`}>
                                <label htmlFor="email" className={styles.inputLabel}>
                                    Email Address
                                </label>
                                <div className={styles.inputWrapper}>
                                    <div className={styles.inputIcon}>
                                        <Mail size={20} />
                                    </div>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField(null)}
                                        required
                                        className={styles.input}
                                        placeholder="Enter your email"
                                        autoComplete="email"
                                    />
                                    <div className={styles.inputBorder}></div>
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className={`${styles.inputGroup} ${focusedField === 'password' ? styles.focused : ''} ${password ? styles.hasFilled : ''}`}>
                                <label htmlFor="password" className={styles.inputLabel}>
                                    Password
                                </label>
                                <div className={styles.inputWrapper}>
                                    <div className={styles.inputIcon}>
                                        <Lock size={20} />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                        required
                                        className={styles.input}
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
                                    <div className={styles.inputBorder}></div>
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
                                <span className={styles.buttonContent}>
                                    {loading ? (
                                        <>
                                            <div className={styles.spinner}></div>
                                            <span>Authenticating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <LogIn size={20} />
                                            <span>Sign In</span>
                                            <ArrowRight size={18} className={styles.arrowIcon} />
                                        </>
                                    )}
                                </span>
                                <div className={styles.buttonGlow}></div>
                            </button>
                        </form>

                        {/* Footer Info */}
                        <div className={styles.cardFooter}>
                            <div className={styles.securityBadge}>
                                <Shield size={14} />
                                <span>Secure B2B Access</span>
                            </div>
                            <p className={styles.footerNote}>
                                Workers must be invited by an administrator
                            </p>
                        </div>
                    </div>

                    {/* Copyright */}
                    <p className={styles.copyright}>
                        © {new Date().getFullYear()} NeuroNavigator. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
