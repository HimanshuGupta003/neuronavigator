'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { KeyRound, CheckCircle2, AlertCircle, User } from 'lucide-react';

function SetupCredentialsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const token = searchParams.get('token');

    const [step, setStep] = useState<'loading' | 'form' | 'success' | 'error'>('loading');
    const [invitation, setInvitation] = useState<{ email: string; id: string } | null>(null);
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) {
            setError('Invalid invitation link. Please contact your administrator.');
            setStep('error');
            return;
        }

        // Verify invitation token
        async function verifyToken() {
            try {
                const response = await fetch(`/api/auth/verify-invitation?token=${token}`);
                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Invalid or expired invitation');
                }

                setInvitation({ email: data.data.email, id: data.data.id });
                setStep('form');
            } catch (err) {
                console.error('Token verification error:', err);
                setError(err instanceof Error ? err.message : 'Failed to verify invitation');
                setStep('error');
            }
        }

        verifyToken();
    }, [token]);

    const handleSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validate passwords
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            setLoading(false);
            return;
        }

        try {
            // Create account via API
            const response = await fetch('/api/auth/setup-credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    fullName,
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to create account');
            }

            setStep('success');

            // Auto-redirect to login after 3 seconds
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err) {
            console.error('Setup error:', err);
            setError(err instanceof Error ? err.message : 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    if (step === 'loading') {
        return (
            <Card padding="lg" className="shadow-xl">
                <CardContent className="py-12">
                    <LoadingSpinner size="lg" text="Verifying invitation..." />
                </CardContent>
            </Card>
        );
    }

    if (step === 'error') {
        return (
            <Card padding="lg" className="shadow-xl">
                <CardContent className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-status-red-bg flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-status-red" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                        Invitation Error
                    </h2>
                    <p className="text-muted mb-6">{error}</p>
                    <Button variant="secondary" onClick={() => router.push('/login')}>
                        Go to Login
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (step === 'success') {
        return (
            <Card padding="lg" className="shadow-xl">
                <CardContent className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-status-green-bg flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-status-green" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                        Account Created!
                    </h2>
                    <p className="text-muted mb-2">
                        Your account has been set up successfully.
                    </p>
                    <p className="text-sm text-muted">
                        Redirecting to login...
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card padding="lg" className="shadow-xl">
            <CardHeader>
                <CardTitle className="text-center text-2xl">Set Up Your Account</CardTitle>
                <CardDescription className="text-center">
                    Create your credentials to get started
                </CardDescription>
            </CardHeader>

            <CardContent>
                {/* Invitation email badge */}
                <div className="mb-6 p-4 bg-muted-bg rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs text-muted">Setting up account for</p>
                        <p className="font-medium text-foreground">{invitation?.email}</p>
                    </div>
                </div>

                <form onSubmit={handleSetup} className="space-y-5">
                    <Input
                        label="Full Name"
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        autoComplete="name"
                    />

                    <Input
                        label="Password"
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        helperText="At least 8 characters"
                    />

                    <Input
                        label="Confirm Password"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
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
                        <KeyRound className="w-5 h-5" />
                        Create Account
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

export default function SetupCredentialsPage() {
    return (
        <Suspense
            fallback={
                <Card padding="lg" className="shadow-xl">
                    <CardContent className="py-12">
                        <LoadingSpinner size="lg" text="Loading..." />
                    </CardContent>
                </Card>
            }
        >
            <SetupCredentialsContent />
        </Suspense>
    );
}
