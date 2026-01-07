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
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      active:scale-[0.98]
    `;

        const variants = {
            primary: `
        bg-[#6366f1] text-white
        hover:bg-[#4f46e5]
        focus-visible:ring-[#6366f1]
        shadow-sm
      `,
            secondary: `
        bg-[#f1f5f9] text-[#334155]
        hover:bg-[#e2e8f0]
        focus-visible:ring-[#64748b]
      `,
            danger: `
        bg-[#ef4444] text-white
        hover:bg-[#dc2626]
        focus-visible:ring-[#ef4444]
        shadow-sm
      `,
            success: `
        bg-[#22c55e] text-white
        hover:bg-[#16a34a]
        focus-visible:ring-[#22c55e]
        shadow-sm
      `,
            ghost: `
        bg-transparent text-[#64748b]
        hover:bg-[#f1f5f9] hover:text-[#334155]
        focus-visible:ring-[#64748b]
      `,
            outline: `
        bg-white text-[#334155]
        border border-[#e2e8f0]
        hover:bg-[#f8fafc] hover:border-[#cbd5e1]
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
