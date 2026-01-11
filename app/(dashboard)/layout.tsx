'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Brain, LogOut, Users, FileText, Home, Mic, ClipboardList, Bell, Sparkles, AlertTriangle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { Profile } from '@/lib/types';
import styles from './dashboard.module.css';

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        loadProfile();
    }, []);

    async function loadProfile() {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileData) {
                setProfile(profileData as Profile);

                const isAdmin = profileData.role === 'admin';
                const onAdminRoute = pathname.startsWith('/admin');
                const onWorkerRoute = pathname.startsWith('/worker');

                if (isAdmin && onWorkerRoute) {
                    router.push('/admin');
                } else if (!isAdmin && onAdminRoute) {
                    router.push('/worker');
                }
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const [sosLoading, setSosLoading] = useState(false);
    const [showSOSModal, setShowSOSModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const handleSOSClick = () => {
        setShowSOSModal(true);
    };

    const handleSOSConfirm = async () => {
        setSosLoading(true);

        try {
            // Get GPS location
            let latitude: number | null = null;
            let longitude: number | null = null;

            if (navigator.geolocation) {
                try {
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 0,
                        });
                    });
                    latitude = position.coords.latitude;
                    longitude = position.coords.longitude;
                } catch (gpsError) {
                    console.warn('GPS not available:', gpsError);
                    // Continue without GPS - still send the alert
                }
            }

            // Call the SOS API
            const response = await fetch('/api/emergency/sos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    latitude,
                    longitude,
                    coachName: profile?.full_name || 'Unknown Coach',
                    coachEmail: profile?.email || 'Unknown Email',
                }),
            });

            const data = await response.json();

            if (data.success) {
                setShowSOSModal(false);
                setShowSuccessModal(true);
            } else {
                throw new Error(data.error || 'Failed to send SOS');
            }

        } catch (error) {
            console.error('SOS Error:', error);
            
            // Fallback to native SMS if API fails
            const fallbackConfirmed = window.confirm(
                '❌ Unable to send automatic alert.\n\nWould you like to open your phone\'s SMS app to send a manual emergency message?'
            );

            if (fallbackConfirmed) {
                // Build SMS fallback
                let smsBody = `EMERGENCY - ${profile?.full_name || 'Job Coach'} needs help!`;
                
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            const mapLink = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
                            smsBody += ` Location: ${mapLink}`;
                            window.location.href = `sms:?body=${encodeURIComponent(smsBody)}`;
                        },
                        () => {
                            window.location.href = `sms:?body=${encodeURIComponent(smsBody)}`;
                        }
                    );
                } else {
                    window.location.href = `sms:?body=${encodeURIComponent(smsBody)}`;
                }
            }
        } finally {
            setSosLoading(false);
            setShowSOSModal(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner}></div>
                    <p className={styles.loadingText}>Loading...</p>
                </div>
            </div>
        );
    }

    const isAdmin = profile?.role === 'admin';

    // Updated terminology: Workers → Job Coaches
    const adminNavItems = [
        { href: '/admin', icon: Home, label: 'Dashboard' },
        { href: '/admin/workers', icon: Users, label: 'Job Coaches' },
        { href: '/admin/invitations', icon: Bell, label: 'Invitations' },
        { href: '/admin/reports', icon: FileText, label: 'Reports' },
    ];

    // Job Coach navigation with Clients
    const coachNavItems = [
        { href: '/worker', icon: Home, label: 'Dashboard' },
        { href: '/worker/clients', icon: Users, label: 'Clients' },
        { href: '/worker/record', icon: Mic, label: 'Record' },
        { href: '/worker/entries', icon: ClipboardList, label: 'Entries' },
        { href: '/worker/reports', icon: FileText, label: 'Reports' },
    ];

    const navItems = isAdmin ? adminNavItems : coachNavItems;

    return (
        <div className={styles.container}>
            {/* Top Header */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    {/* Logo */}
                    <div className={styles.logoSection}>
                        <div className={styles.logoIcon}>
                            <Brain className={styles.brainIcon} />
                        </div>
                        <div className={styles.logoText}>
                            <span className={styles.logoTitle}>
                                <span className={styles.logoGradient}>Neuro</span>Navigator
                            </span>
                            <span className={styles.roleBadge}>
                                <Sparkles size={10} />
                                {isAdmin ? 'Admin' : 'Job Coach'}
                            </span>
                        </div>
                    </div>

                    {/* Right section with SOS and user info */}
                    <div className={styles.userSection}>
                        {/* SOS Button - Always Visible for all users */}
                        <button 
                            onClick={handleSOSClick} 
                            className={styles.sosButton}
                            disabled={sosLoading}
                            style={{ opacity: sosLoading ? 0.7 : 1 }}
                        >
                            <AlertTriangle size={18} />
                            <span>{sosLoading ? 'Sending...' : 'SOS'}</span>
                        </button>

                        <div className={styles.userInfo}>
                            <div className={styles.userAvatar}>
                                {profile?.full_name?.charAt(0) || 'U'}
                            </div>
                            <span className={styles.userName}>
                                {profile?.full_name || 'User'}
                            </span>
                        </div>
                        <button onClick={handleLogout} className={styles.logoutButton}>
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Desktop Sidebar */}
            <aside className={`${styles.sidebar} desktop-sidebar`}>
                <div className={styles.sidebarLabel}>Navigation</div>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.sidebarItem} ${isActive ? styles.sidebarItemActive : ''}`}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </Link>
                    );
                })}
            </aside>

            {/* Main Content */}
            <main className={`${styles.mainContent} main-content ${mounted ? styles.mounted : ''}`}>
                {children}
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className={`${styles.mobileNav} mobile-nav`}>
                {navItems.slice(0, 5).map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.mobileNavItem} ${isActive ? styles.mobileNavItemActive : ''}`}
                        >
                            <item.icon size={24} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <style jsx global>{`
                @media (min-width: 1024px) {
                    .desktop-sidebar {
                        display: flex !important;
                    }
                    .main-content {
                        margin-left: 260px !important;
                        padding-bottom: 24px !important;
                    }
                    .mobile-nav {
                        display: none !important;
                    }
                }
            `}</style>

            {/* SOS Confirmation Modal */}
            <Modal
                isOpen={showSOSModal}
                onClose={() => setShowSOSModal(false)}
                onConfirm={handleSOSConfirm}
                title="Emergency Alert"
                subtitle="SOS Panic Button"
                message="This will immediately send an SMS to your supervisor with your current GPS location."
                warningText="Only use this in a real emergency situation."
                confirmText="Send SOS Alert"
                cancelText="Cancel"
                variant="sos"
                loading={sosLoading}
            />

            {/* Success Modal */}
            <Modal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                onConfirm={() => setShowSuccessModal(false)}
                title="Alert Sent Successfully"
                subtitle="Help is on the way"
                message="Your supervisor has been notified with your location. Stay calm and wait for assistance."
                confirmText="OK"
                cancelText=""
                variant="success"
            />
        </div>
    );
}
