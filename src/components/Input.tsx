import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { htmlListToText } from '../utils/clipboard';
import { normalizeMonth } from '../utils/resumeData';

export const fieldClass = (error?: string) =>
  `w-full rounded-lg border px-3 py-2 text-sm text-ink shadow-card placeholder:text-muted/70 transition-[color,border-color,box-shadow]
   focus:outline-none focus:ring-4 focus:ring-accent/15 focus:border-accent
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

/** What a month picker can show: nothing, or "2021-03". A year alone ("2021") it would show as empty. */
const pickerShows = (value: string) => !value.trim() || /^\d{4}-\d{2}$/.test(value);

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
  const inputRef = useRef<HTMLInputElement>(null);
  // A month field holding a value the picker can't show (a year from an import, "Summer 2019") is plain
  // text until it holds a month again. It only switches while unfocused, so typing isn't interrupted.
  const [asText, setAsText] = useState(() => type === 'month' && !pickerShows(value));
  useEffect(() => {
    if (type === 'month' && document.activeElement !== inputRef.current) setAsText(!pickerShows(value));
  }, [type, value]);
  return (
    <FieldShell id={inputId} label={label} hint={hint} error={error} className={className}>
      <input
        ref={inputRef}
        id={inputId}
        type={asText ? 'text' : type}
        className={fieldClass(error)}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        // Without a month picker the field is plain text: tidy "Jan 2020" or "2020/3" into YYYY-MM.
        onBlur={
          type === 'month'
            ? (e) => {
                const month = normalizeMonth(e.target.value);
                if (month !== e.target.value) onChange(month);
                setAsText(!pickerShows(month));
              }
            : undefined
        }
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
  /** Keep the bullets of a list pasted from a document or web page, as "- " lines. */
  pasteLists?: boolean;
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
  pasteLists = false,
}) => {
  const generatedId = useId();
  const textareaId = `field-${generatedId.replace(/:/g, '')}`;
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    // A hidden textarea (in a closed dialog) measures 0; leave it at its rows until it is shown.
    if (el.scrollHeight) el.style.height = `${el.scrollHeight + 2}px`;
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
        onPaste={
          pasteLists
            ? (e) => {
                const listText = htmlListToText(e.clipboardData.getData('text/html'));
                if (listText === null) return;
                e.preventDefault();
                const el = e.currentTarget;
                // Start the list on its own line when pasting after text.
                const before = el.value.slice(0, el.selectionStart);
                const text = before && !before.endsWith('\n') ? `\n${listText}` : listText;
                // insertText keeps the paste on the undo stack and fires onChange; setRangeText is the fallback.
                if (!document.execCommand('insertText', false, text)) {
                  el.setRangeText(text, el.selectionStart, el.selectionEnd, 'end');
                  onChange(el.value);
                }
              }
            : undefined
        }
        disabled={disabled}
        aria-busy={disabled || undefined}
        aria-describedby={hint ? `${textareaId}-hint` : undefined}
      />
    </FieldShell>
  );
};
