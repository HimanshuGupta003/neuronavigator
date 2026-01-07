import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
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
      font-medium rounded-xl transition-all duration-200 
      focus-visible:outline-none focus-visible:ring-2 
      focus-visible:ring-offset-2 disabled:opacity-50 
      disabled:cursor-not-allowed select-none
    `;

        const variants = {
            primary: `
        bg-primary text-white 
        hover:bg-primary-dark active:bg-primary-dark
        focus-visible:ring-primary
        shadow-md hover:shadow-lg
      `,
            secondary: `
        bg-muted-bg text-foreground 
        hover:bg-border active:bg-border
        focus-visible:ring-muted
      `,
            danger: `
        bg-status-red text-white 
        hover:bg-red-600 active:bg-red-700
        focus-visible:ring-status-red
        shadow-md hover:shadow-lg
      `,
            ghost: `
        bg-transparent text-foreground 
        hover:bg-muted-bg active:bg-border
        focus-visible:ring-muted
      `,
            outline: `
        bg-transparent text-foreground 
        border-2 border-border
        hover:bg-muted-bg active:bg-border
        focus-visible:ring-primary
      `,
        };

        const sizes = {
            sm: 'h-9 px-3 text-sm',
            md: 'h-11 px-5 text-base',
            lg: 'h-14 px-8 text-lg',
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
