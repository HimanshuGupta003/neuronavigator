import { ReactNode } from 'react';
import { Brain } from 'lucide-react';

interface AuthLayoutProps {
    children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-muted-bg/30 to-background">
            {/* Decorative background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
            </div>

            {/* Logo and branding */}
            <div className="flex items-center gap-3 mb-8 animate-fade-in">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg">
                    <Brain className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">
                        NeuroNavigator
                    </h1>
                    <p className="text-xs text-muted">AI-Powered Field Reporting</p>
                </div>
            </div>

            {/* Main content */}
            <div className="w-full max-w-md animate-slide-up">
                {children}
            </div>

            {/* Footer */}
            <p className="mt-8 text-sm text-muted text-center animate-fade-in">
                &copy; {new Date().getFullYear()} NeuroNavigator. All rights reserved.
            </p>
        </div>
    );
}
