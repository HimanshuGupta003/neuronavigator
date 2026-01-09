'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Brain, LogOut, Users, FileText, Home, Mic, ClipboardList, Bell, Sparkles } from 'lucide-react';
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

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.background}>
                    <div className={styles.gradientOrb1}></div>
                    <div className={styles.gradientOrb2}></div>
                    <div className={styles.gradientOrb3}></div>
                    <div className={styles.gridOverlay}></div>
                </div>
                <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner}></div>
                    <p className={styles.loadingText}>Loading...</p>
                </div>
            </div>
        );
    }

    const isAdmin = profile?.role === 'admin';

    const adminNavItems = [
        { href: '/admin', icon: Home, label: 'Dashboard' },
        { href: '/admin/workers', icon: Users, label: 'Workers' },
        { href: '/admin/invitations', icon: Bell, label: 'Invitations' },
        { href: '/admin/reports', icon: FileText, label: 'Reports' },
    ];

    const workerNavItems = [
        { href: '/worker', icon: Home, label: 'Dashboard' },
        { href: '/worker/record', icon: Mic, label: 'Record' },
        { href: '/worker/entries', icon: ClipboardList, label: 'Entries' },
        { href: '/worker/reports', icon: FileText, label: 'Reports' },
    ];

    const navItems = isAdmin ? adminNavItems : workerNavItems;

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
                {mounted && [...Array(12)].map((_, i) => (
                    <div
                        key={i}
                        className={styles.particle}
                        style={{
                            left: `${(i * 8) + Math.random() * 5}%`,
                            animationDelay: `${i * 0.5}s`,
                            animationDuration: `${18 + i * 2}s`
                        }}
                    />
                ))}
            </div>

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
                                {isAdmin ? 'Admin' : 'Worker'}
                            </span>
                        </div>
                    </div>

                    {/* User info */}
                    <div className={styles.userSection}>
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
                {navItems.map((item) => {
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
        </div>
    );
}
