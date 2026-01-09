import { ReactNode, MouseEventHandler } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
    onClick?: MouseEventHandler<HTMLDivElement>;
}

export default function Card({
    children,
    className = '',
    padding = 'md',
    hover = false,
    onClick,
}: CardProps) {
    const paddings = {
        none: '',
        sm: 'p-4',
        md: 'p-5 sm:p-6',
        lg: 'p-6 sm:p-8',
    };

    return (
        <div
            className={`
        bg-[rgba(255,255,255,0.03)] rounded-2xl
        border border-[rgba(255,255,255,0.08)]
        backdrop-blur-xl
        shadow-[0_4px_20px_rgba(0,0,0,0.3)]
        transition-all duration-300
        ${paddings[padding]}
        ${hover ? 'hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] hover:-translate-y-1 cursor-pointer' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

interface CardHeaderProps {
    children: ReactNode;
    className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
    return (
        <div className={`mb-5 ${className}`}>
            {children}
        </div>
    );
}

interface CardTitleProps {
    children: ReactNode;
    className?: string;
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
    return (
        <h3 className={`text-lg font-semibold text-[#ffffff] ${className}`}>
            {children}
        </h3>
    );
}

interface CardDescriptionProps {
    children: ReactNode;
    className?: string;
}

export function CardDescription({ children, className = '' }: CardDescriptionProps) {
    return (
        <p className={`text-sm text-[#737373] mt-1 ${className}`}>
            {children}
        </p>
    );
}

interface CardContentProps {
    children: ReactNode;
    className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
    return <div className={className}>{children}</div>;
}

interface CardFooterProps {
    children: ReactNode;
    className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
    return (
        <div className={`mt-5 pt-5 border-t border-[rgba(255,255,255,0.08)] ${className}`}>
            {children}
        </div>
    );
}
