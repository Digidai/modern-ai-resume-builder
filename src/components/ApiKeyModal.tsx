import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from './Button';
import { KeyIcon } from './Icons';

interface ApiKeyModalProps {
  isOpen: boolean;
  requireApiKey?: boolean;
  requireConsent?: boolean;
  initialApiKey?: string;
  onClose: () => void;
  onSave: (settings: { apiKey: string; consentGranted: boolean }) => void | Promise<void>;
}

const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];

  return Array.from(container.querySelectorAll<HTMLElement>(selectors.join(','))).filter(
    (node) => !node.hasAttribute('disabled') && node.getAttribute('aria-hidden') !== 'true'
  );
};

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  requireApiKey = false,
  requireConsent = true,
  initialApiKey = '',
  onClose,
  onSave,
}) => {
  const [key, setKey] = useState(initialApiKey);
  const [consentGranted, setConsentGranted] = useState(!requireConsent);
  const [isSaving, setIsSaving] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const titleId = useMemo(() => 'ai-settings-title', []);
  const descriptionId = useMemo(() => 'ai-settings-description', []);

  useEffect(() => {
    if (!isOpen) return;
    setKey(initialApiKey);
    setConsentGranted(!requireConsent);
  }, [initialApiKey, isOpen, requireConsent]);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = getFocusableElements(dialog);
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;
      const nodes = getFocusableElements(dialog);
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const canSubmit =
    !isSaving &&
    (!requireApiKey || Boolean(key.trim())) &&
    (!requireConsent || consentGranted);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSaving(true);
    try {
      await onSave({ apiKey: key.trim(), consentGranted: consentGranted || !requireConsent });
      onClose();
    } catch {
      // Keep the modal open; the caller shows an error message.
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onMouseDown={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-800"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4 text-indigo-600 dark:text-indigo-400">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
            <KeyIcon className="w-6 h-6" />
          </div>
          <h2 id={titleId} className="text-xl font-bold text-slate-900 dark:text-white">
            AI Settings
          </h2>
        </div>

        <p id={descriptionId} className="text-slate-600 dark:text-slate-300 mb-4 text-sm leading-relaxed">
          AI actions send selected resume text to Google Gemini for processing. Avoid sharing private or sensitive data.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="gemini-api-key-input"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5"
            >
              Personal Gemini API Key {requireApiKey ? '(Required)' : '(Optional)'}
            </label>
            <input
              id="gemini-api-key-input"
              type="password"
              value={key}
              onChange={(event) => setKey(event.target.value)}
              placeholder="AIza..."
              className="w-full p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-sm"
              aria-required={requireApiKey}
            />
            <div className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              Need a key?{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Generate one in Google AI Studio
              </a>
              .
            </div>
          </div>

          {requireConsent && (
            <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={consentGranted}
                onChange={(event) => setConsentGranted(event.target.checked)}
                className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                required
              />
              <span>
                I understand selected content will be sent to Google Gemini for AI processing.
              </span>
            </label>
          )}

          <div className="flex gap-3 mt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!canSubmit} className="flex-1" isLoading={isSaving}>
              Save & Continue
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
