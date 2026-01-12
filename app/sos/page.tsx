'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangle } from 'lucide-react';

export default function SOSIndexPage() {
    const router = useRouter();
    const [error, setError] = useState(false);

    useEffect(() => {
        // Check localStorage for saved token
        const savedToken = localStorage.getItem('sos_token');
        
        if (savedToken) {
            // Redirect to the token page
            router.replace(`/sos/${savedToken}`);
        } else {
            // No token saved, show error
            setError(true);
        }
    }, [router]);

    if (error) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                background: 'linear-gradient(180deg, #fef2f2 0%, #fee2e2 100%)',
                fontFamily: 'system-ui, -apple-system, sans-serif',
            }}>
                <div style={{
                    background: 'white',
                    borderRadius: '24px',
                    padding: '40px 32px',
                    textAlign: 'center',
                    maxWidth: '340px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                }}>
                    <AlertTriangle size={48} style={{ color: '#dc2626', marginBottom: '16px' }} />
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', margin: '0 0 12px 0' }}>
                        No Safety Link Found
                    </h2>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                        Please open the safety link from your Job Coach first, then add to Home Screen.
                    </p>
                </div>
            </div>
        );
    }

    // Loading state while checking token
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, #fef2f2 0%, #fee2e2 100%)',
        }}>
            <Loader2 
                size={48} 
                style={{ 
                    color: '#dc2626',
                    animation: 'spin 1s linear infinite',
                }} 
            />
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
