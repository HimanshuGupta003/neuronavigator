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
                        className="block text-sm font-medium text-[#e5e5e5] mb-1.5"
                    >
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={`
            w-full h-11 px-4
            bg-[rgba(0,0,0,0.5)] text-[#ffffff]
            border border-[rgba(255,255,255,0.1)] rounded-lg
            transition-all duration-200
            placeholder:text-[#525252]
            focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:ring-offset-0 focus:border-[#6366f1]
            focus:bg-[rgba(0,0,0,0.7)]
            hover:border-[rgba(255,255,255,0.18)]
            ${error ? 'border-[#ef4444] focus:ring-[#ef4444] focus:border-[#ef4444]' : ''}
            disabled:bg-[#0a0a0a] disabled:text-[#525252] disabled:cursor-not-allowed
            ${className}
          `}
                    {...props}
                />
                {error && (
                    <p className="mt-1.5 text-sm text-[#f87171]">{error}</p>
                )}
                {helperText && !error && (
                    <p className="mt-1.5 text-sm text-[#737373]">{helperText}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
