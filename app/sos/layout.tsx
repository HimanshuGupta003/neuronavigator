import { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
    title: 'Safety Alert - SOS',
    description: 'Emergency safety button for immediate assistance',
    manifest: '/sos-manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'Safety SOS',
    },
    formatDetection: {
        telephone: true,
    },
};

export const viewport: Viewport = {
    themeColor: '#dc2626',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function SOSLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                {/* iOS PWA Meta Tags */}
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="Safety SOS" />
                <link rel="apple-touch-icon" href="/icons/sos-icon-180.png" />
                
                {/* Android PWA */}
                <link rel="manifest" href="/sos-manifest.json" />
            </head>
            <body style={{ margin: 0, padding: 0 }}>
                {children}
            </body>
        </html>
    );
}
