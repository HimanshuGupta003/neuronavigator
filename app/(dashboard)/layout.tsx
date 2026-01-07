'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Brain, LogOut, Users, FileText, Home, Mic, ClipboardList, Bell } from 'lucide-react';
import { Profile } from '@/lib/types';

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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

        loadProfile();
    }, [router, pathname, supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f3f4f6'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid #6366f1',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px auto'
                    }} />
                    <p style={{ color: '#6b7280' }}>Loading...</p>
                </div>
                <style jsx global>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
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
        <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
            {/* Top Header */}
            <header style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '60px',
                backgroundColor: '#ffffff',
                borderBottom: '1px solid #e5e7eb',
                zIndex: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px'
            }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: '#6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Brain style={{ width: '20px', height: '20px', color: 'white' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>NeuroNavigator</span>
                        <span style={{
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#6b7280',
                            backgroundColor: '#f3f4f6',
                            padding: '2px 8px',
                            borderRadius: '4px'
                        }}>
                            {isAdmin ? 'Admin' : 'Worker'}
                        </span>
                    </div>
                </div>

                {/* User info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}>
                        {profile?.full_name?.charAt(0) || 'U'}
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                        {profile?.full_name || 'User'}
                    </span>
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 12px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: '#6b7280',
                            fontSize: '14px'
                        }}
                    >
                        <LogOut style={{ width: '18px', height: '18px' }} />
                    </button>
                </div>
            </header>

            {/* Desktop Sidebar */}
            <aside style={{
                position: 'fixed',
                top: '60px',
                left: 0,
                width: '220px',
                height: 'calc(100vh - 60px)',
                backgroundColor: '#ffffff',
                borderRight: '1px solid #e5e7eb',
                padding: '16px 12px',
                display: 'none'
            }} className="desktop-sidebar">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 14px',
                                borderRadius: '10px',
                                marginBottom: '4px',
                                textDecoration: 'none',
                                backgroundColor: isActive ? '#6366f1' : 'transparent',
                                color: isActive ? '#ffffff' : '#6b7280',
                                fontSize: '14px',
                                fontWeight: '500',
                                transition: 'all 0.15s'
                            }}
                        >
                            <item.icon style={{ width: '20px', height: '20px' }} />
                            {item.label}
                        </Link>
                    );
                })}
            </aside>

            {/* Main Content */}
            <main style={{
                paddingTop: '60px',
                paddingBottom: '80px',
                minHeight: '100vh'
            }} className="main-content">
                {children}
            </main>

            {/* Mobile Bottom Navigation */}
            <nav style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: '70px',
                backgroundColor: '#ffffff',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                padding: '0 8px',
                zIndex: 40
            }} className="mobile-nav">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                padding: '8px 16px',
                                borderRadius: '12px',
                                textDecoration: 'none',
                                color: isActive ? '#6366f1' : '#9ca3af',
                                minWidth: '60px'
                            }}
                        >
                            <item.icon style={{ width: '24px', height: '24px' }} />
                            <span style={{ fontSize: '11px', fontWeight: '500' }}>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @media (min-width: 1024px) {
          .desktop-sidebar {
            display: block !important;
          }
          .main-content {
            margin-left: 220px !important;
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
