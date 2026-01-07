'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { LogIn, Shield } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                throw authError;
            }

            if (data.user) {
                // Get user profile to determine role
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                if (profileError) {
                    console.error('Profile fetch error:', profileError);
                    // Still redirect to worker by default
                    router.push('/worker');
                    return;
                }

                // Redirect based on role
                if (profile?.role === 'admin') {
                    router.push('/admin');
                } else {
                    router.push('/worker');
                }

                router.refresh();
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err instanceof Error ? err.message : 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card padding="lg" className="shadow-xl">
            <CardHeader>
                <CardTitle className="text-center text-2xl">Welcome Back</CardTitle>
                <CardDescription className="text-center">
                    Sign in to access your dashboard
                </CardDescription>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleLogin} className="space-y-5">
                    <Input
                        label="Email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                    />

                    <Input
                        label="Password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                    />

                    {error && (
                        <div className="p-4 bg-status-red-bg border border-status-red/20 rounded-xl">
                            <p className="text-sm text-status-red">{error}</p>
                        </div>
                    )}

                    <Button
                        type="submit"
                        fullWidth
                        size="lg"
                        loading={loading}
                    >
                        <LogIn className="w-5 h-5" />
                        Sign In
                    </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-muted justify-center">
                        <Shield className="w-4 h-4" />
                        <span>Secure B2B access only</span>
                    </div>
                    <p className="text-xs text-muted text-center mt-2">
                        Workers must be invited by an administrator
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
