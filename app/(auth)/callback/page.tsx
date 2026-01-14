'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './callback.module.css';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();
    const [status, setStatus] = useState('Processing...');

    useEffect(() => {
        handleAuthCallback();
    }, []);

    async function handleAuthCallback() {
        try {
            // Check for hash fragment (Supabase puts tokens in hash)
            const hash = window.location.hash;
            const hashParams = new URLSearchParams(hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            const tokenType = hashParams.get('type');

            // Also check query params
            const error = searchParams.get('error');
            const errorDescription = searchParams.get('error_description');

            if (error) {
                setStatus(`Error: ${errorDescription || error}`);
                setTimeout(() => router.push('/login'), 3000);
                return;
            }

            // If this is a password recovery flow, redirect to reset-password page
            if (tokenType === 'recovery' && accessToken && refreshToken) {
                setStatus('Redirecting to password reset...');
                // Redirect to reset-password page with the hash intact
                window.location.href = `/reset-password${hash}`;
                return;
            }

            if (accessToken && refreshToken) {
                // Set the session
                const { data, error: sessionError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });

                if (sessionError) {
                    setStatus('Session error. Redirecting to login...');
                    setTimeout(() => router.push('/login'), 2000);
                    return;
                }

                if (data.user) {
                    // Check if user has a profile with full_name set
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('full_name, role')
                        .eq('id', data.user.id)
                        .single();

                    if (!profile || !profile.full_name) {
                        // New user from invite - redirect to complete profile
                        setStatus('Account confirmed! Setting up your profile...');
                        router.push('/complete-profile');
                    } else if (profile.role === 'admin') {
                        setStatus('Welcome back! Redirecting...');
                        router.push('/admin');
                    } else {
                        setStatus('Welcome back! Redirecting...');
                        router.push('/worker');
                    }
                }
            } else {
                // No tokens - might be a different flow
                setStatus('No authentication data found. Redirecting...');
                setTimeout(() => router.push('/login'), 2000);
            }
        } catch (err) {
            console.error('Auth callback error:', err);
            setStatus('An error occurred. Redirecting to login...');
            setTimeout(() => router.push('/login'), 2000);
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.spinner}></div>
                <p className={styles.status}>{status}</p>
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.spinner}></div>
                    <p className={styles.status}>Loading...</p>
                </div>
            </div>
        }>
            <CallbackContent />
        </Suspense>
    );
}
