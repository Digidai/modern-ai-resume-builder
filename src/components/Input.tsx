import React, { useId, useLayoutEffect, useRef } from 'react';

const fieldClass = (error?: string) =>
  `w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-colors
   focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500
   disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400
   dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-slate-900 ${
     error
       ? 'border-red-400 bg-red-50/50 dark:border-red-500/60 dark:bg-red-950/30'
       : 'border-slate-300 bg-white hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600'
   }`;

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  /** Extra controls aligned with the label, e.g. AI buttons. */
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

const FieldShell: React.FC<FieldShellProps> = ({ id, label, hint, error, actions, className = '', children }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <div className="flex min-h-6 items-center justify-between gap-2">
      <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      {actions}
    </div>
    {children}
    {error ? (
      <p id={`${id}-error`} className="text-xs text-red-600 dark:text-red-400">
        {error}
      </p>
    ) : (
      hint && (
        <p id={`${id}-hint`} className="text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )
    )}
  </div>
);

interface InputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  id?: string;
  type?: string;
  placeholder?: string;
  hint?: string;
  autoComplete?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChange,
  id,
  type = 'text',
  placeholder,
  hint,
  autoComplete,
  disabled = false,
  error,
  className,
}) => {
  const generatedId = useId();
  const inputId = id || `field-${generatedId.replace(/:/g, '')}`;
  return (
    <FieldShell id={inputId} label={label} hint={hint} error={error} className={className}>
      <input
        id={inputId}
        type={type}
        className={fieldClass(error)}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
      />
    </FieldShell>
  );
};

interface TextareaProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  hint?: string;
  actions?: React.ReactNode;
  disabled?: boolean;
  /** Minimum visible rows; the field grows with its content. */
  minRows?: number;
  className?: string;
}

/** Auto-growing textarea with the same label/hint layout as Input. */
export const Textarea: React.FC<TextareaProps> = ({
  label,
  value,
  onChange,
  placeholder,
  hint,
  actions,
  disabled = false,
  minRows = 3,
  className,
}) => {
  const generatedId = useId();
  const textareaId = `field-${generatedId.replace(/:/g, '')}`;
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);

  return (
    <FieldShell id={textareaId} label={label} hint={hint} actions={actions} className={className}>
      <textarea
        ref={ref}
        id={textareaId}
        rows={minRows}
        className={`${fieldClass()} resize-none leading-relaxed`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-busy={disabled || undefined}
        aria-describedby={hint ? `${textareaId}-hint` : undefined}
      />
    </FieldShell>
  );
};
