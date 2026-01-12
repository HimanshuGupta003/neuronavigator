'use client';

import { useState, useEffect, use } from 'react';
import { AlertTriangle, Shield, Check, Loader2 } from 'lucide-react';
import styles from './sos.module.css';

interface PageProps {
    params: Promise<{ token: string }>;
}

type Status = 'idle' | 'loading' | 'confirming' | 'sending' | 'sent' | 'error' | 'invalid';

export default function ClientSOSPage({ params }: PageProps) {
    const { token } = use(params);
    const [status, setStatus] = useState<Status>('loading');
    const [clientName, setClientName] = useState<string>('');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        verifyToken();
    }, [token]);

    const verifyToken = async () => {
        try {
            // Save token to localStorage for PWA home screen launch
            localStorage.setItem('sos_token', token);
            
            // Simple verification by attempting to get client info
            // In production, you might want a dedicated verify endpoint
            setStatus('idle');
            setClientName(''); // Will be set on successful SOS
        } catch {
            setStatus('invalid');
        }
    };

    const handleSOSClick = () => {
        setStatus('confirming');
    };

    const handleConfirm = async () => {
        setStatus('sending');

        try {
            // Get GPS location with longer timeout for first-time permission
            let latitude: number | undefined;
            let longitude: number | undefined;

            if (navigator.geolocation) {
                try {
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            enableHighAccuracy: true,
                            timeout: 15000, // 15 seconds for permission dialog
                            maximumAge: 60000, // Accept cached location up to 1 minute old
                        });
                    });
                    latitude = position.coords.latitude;
                    longitude = position.coords.longitude;
                } catch (gpsError) {
                    console.warn('GPS error:', gpsError);
                    // Continue without location - don't block the SOS
                }
            }

            // Send SOS request
            const response = await fetch('/api/safety-link/sos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    latitude,
                    longitude,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to send alert');
            }

            setClientName(data.clientName || '');

            // Check if we need to use native SMS fallback
            if (data.useFallback && data.fallbackPhones && data.fallbackPhones.length > 0) {
                // Build SMS body
                let smsBody = data.fallbackMessage || `🚨 SOS EMERGENCY - ${data.clientName} needs help!`;
                
                // For multiple recipients, most phones only support one number in sms: protocol
                // Join first phone number for the sms: link
                const phone = data.fallbackPhones[0];
                
                // Open native SMS app with pre-filled message
                const smsUrl = `sms:${phone}?body=${encodeURIComponent(smsBody)}`;
                window.location.href = smsUrl;
                
                // Show success after a brief delay
                setTimeout(() => {
                    setStatus('sent');
                }, 500);
            } else {
                setStatus('sent');
            }

        } catch (err) {
            console.error('SOS error:', err);
            
            if (err instanceof Error && err.message.includes('Invalid')) {
                setStatus('invalid');
            } else {
                setError(err instanceof Error ? err.message : 'Failed to send alert');
                setStatus('error');
            }
        }
    };

    const handleCancel = () => {
        setStatus('idle');
    };

    const handleRetry = () => {
        setError('');
        setStatus('idle');
    };

    // Invalid token
    if (status === 'invalid') {
        return (
            <div className={styles.container}>
                <div className={styles.invalidCard}>
                    <div className={styles.invalidIconWrapper}>
                        <Shield size={40} className={styles.invalidIcon} />
                    </div>
                    <h1 className={styles.invalidTitle}>Link Not Valid</h1>
                    <p className={styles.invalidText}>
                        This safety link is no longer active. Please contact your Job Coach for a new link.
                    </p>
                </div>
            </div>
        );
    }

    // Loading
    if (status === 'loading') {
        return (
            <div className={styles.container}>
                <Loader2 size={48} className={styles.spinner} />
            </div>
        );
    }

    // Success
    if (status === 'sent') {
        return (
            <div className={styles.container}>
                <div className={styles.successCard}>
                    <div className={styles.successIconWrapper}>
                        <Check size={64} className={styles.successIcon} />
                    </div>
                    <h1 className={styles.successTitle}>Help is on the way!</h1>
                    <p className={styles.successText}>
                        Emergency contacts have been notified of your location.
                        {clientName && <br />}
                        {clientName && <span>Stay calm, {clientName}.</span>}
                    </p>
                </div>
            </div>
        );
    }

    // Error
    if (status === 'error') {
        return (
            <div className={styles.container}>
                <div className={styles.errorCard}>
                    <AlertTriangle size={48} className={styles.errorIcon} />
                    <h2 className={styles.errorTitle}>Could not send alert</h2>
                    <p className={styles.errorText}>{error}</p>
                    <button className={styles.retryButton} onClick={handleRetry}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Confirmation modal
    if (status === 'confirming') {
        return (
            <div className={styles.container}>
                <div className={styles.confirmCard}>
                    <AlertTriangle size={48} className={styles.confirmIcon} />
                    <h2 className={styles.confirmTitle}>Send Emergency Alert?</h2>
                    <p className={styles.confirmText}>
                        This will immediately notify your emergency contacts with your location.
                    </p>
                    <div className={styles.confirmButtons}>
                        <button className={styles.cancelButton} onClick={handleCancel}>
                            Cancel
                        </button>
                        <button className={styles.confirmButton} onClick={handleConfirm}>
                            Yes, Send Alert
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Sending state
    if (status === 'sending') {
        return (
            <div className={styles.container}>
                <div className={styles.sendingCard}>
                    <Loader2 size={48} className={styles.spinner} />
                    <p className={styles.sendingText}>Sending emergency alert...</p>
                </div>
            </div>
        );
    }

    // Main SOS button (idle state)
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Shield size={24} className={styles.headerIcon} />
                <span className={styles.headerText}>Safety Alert</span>
            </div>

            <button 
                className={styles.sosButton}
                onClick={handleSOSClick}
            >
                <span className={styles.sosText}>SOS</span>
                <span className={styles.sosSubtext}>Tap for help</span>
            </button>

            <p className={styles.footer}>
                Press the button above if you need immediate assistance
            </p>
        </div>
    );
}
