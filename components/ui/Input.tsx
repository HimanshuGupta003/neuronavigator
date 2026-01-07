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
                        className="block text-sm font-medium text-[#334155] mb-1.5"
                    >
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={`
            w-full h-10 px-3
            bg-white text-[#0f172a]
            border border-[#e2e8f0] rounded-lg
            transition-colors duration-150
            placeholder:text-[#94a3b8]
            focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:ring-offset-0 focus:border-[#6366f1]
            hover:border-[#cbd5e1]
            ${error ? 'border-[#ef4444] focus:ring-[#ef4444] focus:border-[#ef4444]' : ''}
            disabled:bg-[#f8fafc] disabled:text-[#94a3b8] disabled:cursor-not-allowed
            ${className}
          `}
                    {...props}
                />
                {error && (
                    <p className="mt-1.5 text-sm text-[#ef4444]">{error}</p>
                )}
                {helperText && !error && (
                    <p className="mt-1.5 text-sm text-[#64748b]">{helperText}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
