'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Brain, LogOut, Users, FileText, Home, Mic, ClipboardList, Settings, Bell } from 'lucide-react';
import { Profile } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';

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

                    // Redirect if accessing wrong dashboard
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
            <div className="min-h-screen flex items-center justify-center bg-background">
                <LoadingSpinner size="lg" text="Loading..." />
            </div>
        );
    }

    const isAdmin = profile?.role === 'admin';

    // Navigation items based on role
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
        <div className="min-h-screen bg-muted-bg">
            {/* Top Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-40 px-4 lg:px-6">
                <div className="h-full flex items-center justify-between max-w-7xl mx-auto">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-md">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-lg font-bold text-foreground">NeuroNavigator</h1>
                            <p className="text-xs text-muted -mt-1">
                                {isAdmin ? 'Admin Portal' : 'Worker Portal'}
                            </p>
                        </div>
                    </div>

                    {/* User info and logout */}
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-foreground">
                                {profile?.full_name || 'User'}
                            </p>
                            <p className="text-xs text-muted capitalize">
                                {profile?.role}
                            </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleLogout}>
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Logout</span>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main content area with bottom nav on mobile, sidebar on desktop */}
            <div className="pt-16 pb-20 lg:pb-0 lg:pl-64">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:fixed lg:top-16 lg:left-0 lg:w-64 lg:h-[calc(100vh-4rem)] lg:flex lg:flex-col bg-card border-r border-border p-4">
                    <nav className="flex-1 space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl
                    transition-all duration-200 font-medium
                    ${isActive
                                            ? 'bg-primary text-white shadow-md'
                                            : 'text-muted hover:bg-muted-bg hover:text-foreground'
                                        }
                  `}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </a>
                            );
                        })}
                    </nav>
                </aside>

                {/* Page content */}
                <main className="p-4 lg:p-6 min-h-[calc(100vh-4rem)]">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-card border-t border-border px-2 z-40">
                <div className="h-full flex items-center justify-around">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <a
                                key={item.href}
                                href={item.href}
                                className={`
                  flex flex-col items-center gap-1 px-4 py-2 rounded-xl
                  transition-all duration-200 min-w-[60px]
                  ${isActive
                                        ? 'text-primary'
                                        : 'text-muted hover:text-foreground'
                                    }
                `}
                            >
                                <item.icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform`} />
                                <span className="text-xs font-medium">{item.label}</span>
                            </a>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
