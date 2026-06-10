'use client';

import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  /** Muestra la etiqueta "opcional" junto al label */
  optional?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, optional, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-rose-500"> *</span>}
            {!props.required && optional && (
              <span className="text-xs font-normal text-gray-400"> · opcional</span>
            )}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-xl border px-3 py-3 text-sm text-gray-900 placeholder-gray-400 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${error ? 'border-rose-400' : 'border-gray-200'} ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
