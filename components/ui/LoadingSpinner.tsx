import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    text?: string;
}

export default function LoadingSpinner({
    size = 'md',
    className = '',
    text,
}: LoadingSpinnerProps) {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    return (
        <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
            <Loader2 className={`${sizes[size]} text-primary animate-spin`} />
            {text && <p className="text-sm text-muted">{text}</p>}
        </div>
    );
}

export function FullPageLoader({ text = 'Loading...' }: { text?: string }) {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
            <LoadingSpinner size="lg" text={text} />
        </div>
    );
}
