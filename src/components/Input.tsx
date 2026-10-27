import React, { useId, useLayoutEffect, useRef } from 'react';

export const fieldClass = (error?: string) =>
  `w-full rounded-[2px] border px-3 py-2 text-sm text-ink placeholder:text-muted transition-colors
   focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent
   disabled:cursor-not-allowed disabled:bg-paper disabled:text-muted
   ${
     error
       ? 'border-danger bg-danger/5'
       : 'border-rule bg-surface hover:border-muted'
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
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      {actions}
    </div>
    {children}
    {error ? (
      <p id={`${id}-error`} className="text-xs text-danger">
        {error}
      </p>
    ) : (
      hint && (
        <p id={`${id}-hint`} className="text-xs text-muted">
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
