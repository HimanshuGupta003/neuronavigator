import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            children,
            variant = 'primary',
            size = 'md',
            loading = false,
            fullWidth = false,
            disabled,
            className = '',
            ...props
        },
        ref
    ) => {
        const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-medium rounded-lg
      transition-all duration-150
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]
      disabled:opacity-50 disabled:cursor-not-allowed
      active:scale-[0.98]
    `;

        const variants = {
            primary: `
        bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white
        hover:from-[#818cf8] hover:to-[#a78bfa]
        focus-visible:ring-[#6366f1]
        shadow-[0_4px_12px_rgba(99,102,241,0.4)]
      `,
            secondary: `
        bg-[#171717] text-[#e5e5e5]
        hover:bg-[#1f1f1f]
        focus-visible:ring-[#525252]
        border border-[rgba(255,255,255,0.08)]
      `,
            danger: `
        bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white
        hover:from-[#f87171] hover:to-[#ef4444]
        focus-visible:ring-[#ef4444]
        shadow-[0_4px_12px_rgba(239,68,68,0.4)]
      `,
            success: `
        bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white
        hover:from-[#4ade80] hover:to-[#22c55e]
        focus-visible:ring-[#22c55e]
        shadow-[0_4px_12px_rgba(34,197,94,0.4)]
      `,
            ghost: `
        bg-transparent text-[#a3a3a3]
        hover:bg-[rgba(255,255,255,0.05)] hover:text-[#e5e5e5]
        focus-visible:ring-[#525252]
      `,
            outline: `
        bg-transparent text-[#e5e5e5]
        border border-[rgba(255,255,255,0.1)]
        hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.2)]
        focus-visible:ring-[#6366f1]
      `,
        };

        const sizes = {
            sm: 'h-8 px-3 text-sm',
            md: 'h-10 px-4 text-sm',
            lg: 'h-12 px-6 text-base',
        };

        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={`
          ${baseStyles} 
          ${variants[variant]} 
          ${sizes[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
                {...props}
            >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
