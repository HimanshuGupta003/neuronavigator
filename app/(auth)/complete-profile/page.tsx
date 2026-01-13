'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Brain, User, Lock, Check } from 'lucide-react';
import styles from './complete-profile.module.css';

export default function CompleteProfilePage() {
    const router = useRouter();
    const supabase = createClient();

    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        checkUser();
    }, []);

    async function checkUser() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }
        setUserEmail(user.email || '');
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Update password
            const { error: passwordError } = await supabase.auth.updateUser({
                password: password,
            });

            if (passwordError) throw passwordError;

            // Update profile
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    email: user.email,
                    full_name: fullName,
                    role: 'worker',
                    updated_at: new Date().toISOString(),
                });

            if (profileError) throw profileError;

            // Redirect to dashboard
            router.push('/worker');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to complete setup');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                {/* Logo */}
                <div className={styles.logoSection}>
                    <div className={styles.logoIcon}>
                        <Brain size={32} />
                    </div>
                    <h1 className={styles.logoText}>
                        <span className={styles.logoGradient}>Coach</span>Ally
                    </h1>
                </div>

                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.successBadge}>
                        <Check size={20} />
                    </div>
                    <h2 className={styles.title}>Complete Your Profile</h2>
                    <p className={styles.subtitle}>
                        Set up your password to finish creating your account
                    </p>
                    {userEmail && (
                        <p className={styles.emailDisplay}>{userEmail}</p>
                    )}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Full Name</label>
                        <div className={styles.inputWrapper}>
                            <User size={20} className={styles.inputIcon} />
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                placeholder="Enter your full name"
                                className={styles.input}
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Password</label>
                        <div className={styles.inputWrapper}>
                            <Lock size={20} className={styles.inputIcon} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Create a password"
                                className={styles.input}
                                minLength={6}
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Confirm Password</label>
                        <div className={styles.inputWrapper}>
                            <Lock size={20} className={styles.inputIcon} />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="Confirm your password"
                                className={styles.input}
                                minLength={6}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className={styles.errorBox}>
                            {error}
                        </div>
                    )}

                    <button type="submit" disabled={loading} className={styles.submitButton}>
                        {loading ? 'Setting up...' : 'Complete Setup'}
                    </button>
                </form>
            </div>
        </div>
    );
}
