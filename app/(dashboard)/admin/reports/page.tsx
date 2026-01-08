'use client';

import { FileText, Construction } from 'lucide-react';

export default function AdminReportsPage() {
    const cardStyle: React.CSSProperties = {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    };

    return (
        <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>Reports</h1>
                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>View all generated reports</p>
            </div>

            <div style={cardStyle}>
                <div style={{ padding: '48px 0', textAlign: 'center' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '16px',
                        backgroundColor: '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px auto'
                    }}>
                        <Construction style={{ width: '32px', height: '32px', color: '#9ca3af' }} />
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>Coming Soon</h2>
                    <p style={{ fontSize: '14px', color: '#6b7280', maxWidth: '300px', margin: '0 auto' }}>
                        The reports section will be available once voice recording and AI processing features are implemented.
                    </p>
                </div>
            </div>
        </div>
    );
}
