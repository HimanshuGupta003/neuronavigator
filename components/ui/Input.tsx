import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, className = '', id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-foreground mb-2"
                    >
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={`
            w-full h-12 px-4 
            bg-card text-foreground
            border-2 rounded-xl
            transition-all duration-200
            placeholder:text-muted
            focus:outline-none focus:ring-0
            ${error
                            ? 'border-status-red focus:border-status-red'
                            : 'border-border focus:border-primary hover:border-muted'
                        }
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
                    {...props}
                />
                {error && (
                    <p className="mt-2 text-sm text-status-red">{error}</p>
                )}
                {helperText && !error && (
                    <p className="mt-2 text-sm text-muted">{helperText}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
