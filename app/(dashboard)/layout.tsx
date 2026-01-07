'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Brain, LogOut, Users, FileText, Home, Mic, ClipboardList, Bell, ChevronRight } from 'lucide-react';
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
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
                <LoadingSpinner size="lg" text="Loading..." />
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
        <div className="min-h-screen bg-[#f8fafc]">
            {/* Top Header */}
            <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-[#e2e8f0] z-40">
                <div className="h-full flex items-center justify-between px-4 lg:px-6 max-w-[1600px] mx-auto">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#6366f1] flex items-center justify-center">
                            <Brain className="w-4 h-4 text-white" />
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-base font-semibold text-[#0f172a]">NeuroNavigator</h1>
                        </div>
                        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#f1f5f9] text-[#64748b]">
                            {isAdmin ? 'Admin' : 'Worker'}
                        </span>
                    </div>

                    {/* User info and logout */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#f1f5f9] flex items-center justify-center">
                                <span className="text-sm font-medium text-[#64748b]">
                                    {profile?.full_name?.charAt(0) || 'U'}
                                </span>
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-medium text-[#0f172a]">
                                    {profile?.full_name || 'User'}
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleLogout}>
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main content area */}
            <div className="pt-14 pb-20 lg:pb-6 lg:pl-56">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:block fixed top-14 left-0 w-56 h-[calc(100vh-3.5rem)] bg-white border-r border-[#e2e8f0]">
                    <nav className="p-3 space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-colors duration-150 text-sm font-medium
                    ${isActive
                                            ? 'bg-[#6366f1] text-white'
                                            : 'text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]'
                                        }
                  `}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.label}
                                    {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* Page content */}
                <main className="p-4 sm:p-6 min-h-[calc(100vh-3.5rem)]">
                    <div className="max-w-5xl mx-auto animate-fade-in">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#e2e8f0] z-40">
                <div className="h-full flex items-center justify-around px-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                  flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg min-w-[56px]
                  transition-colors duration-150
                  ${isActive
                                        ? 'text-[#6366f1]'
                                        : 'text-[#94a3b8]'
                                    }
                `}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
