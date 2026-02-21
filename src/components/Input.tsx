import React, { useId } from 'react';

interface InputProps {
    label: string;
    value: string;
    onChange: (val: string) => void;
    id?: string;
    type?: string;
    disabled?: boolean;
    error?: string;
}

export const Input: React.FC<InputProps> = ({
    label,
    value,
    onChange,
    id,
    type = "text",
    disabled = false,
    error
}) => {
    const generatedId = useId();
    const safeLabel = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const inputId = id || `input-${safeLabel}-${generatedId.replace(/:/g, '')}`;
    const errorId = `${inputId}-error`;

    return (
        <div className="flex flex-col gap-1">
            <label htmlFor={inputId} className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {label}
            </label>
            <input
                id={inputId}
                type={type}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-400 ${error
                        ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                    }`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
            />
            {error && (
                <p id={errorId} className="text-xs text-red-600 dark:text-red-400" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
};
