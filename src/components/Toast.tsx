import { useState, createContext, useContext, useCallback, useMemo, useRef, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  /** Optional inline action, e.g. Undo. Clicking it also dismisses the toast. */
  action?: { label: string; onClick: () => void };
  duration?: number;
}

interface Toast extends ToastOptions {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, options?: ToastOptions) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4000;
const ACTION_DURATION = 7000;
const MAX_TOASTS = 3;

const iconColor: Record<ToastType, string> = {
  success: 'text-emerald-400',
  error: 'text-red-400',
  info: 'text-indigo-300',
  warning: 'text-amber-300',
};

const ICON_PATHS: Record<ToastType, string> = {
  success: 'M5 13l4 4L19 7',
  error: 'M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  warning: 'M12 9v2m0 4h.01M5.1 19h13.8c1.5 0 2.5-1.7 1.7-3L13.7 4c-.8-1.3-2.7-1.3-3.5 0L3.3 16c-.8 1.3.2 3 1.8 3z',
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, number>());

  const removeToast = useCallback((id: string) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', options: ToastOptions = {}) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      // Replace an identical visible message instead of stacking duplicates.
      setToasts((prev) => [...prev.filter((t) => t.message !== message), { id, message, type, ...options }].slice(-MAX_TOASTS));
      const duration = options.duration ?? (options.action ? ACTION_DURATION : DEFAULT_DURATION);
      timers.current.set(id, window.setTimeout(() => removeToast(id), duration));
    },
    [removeToast]
  );

  const showSuccess = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const showError = useCallback((message: string) => showToast(message, 'error'), [showToast]);
  const value = useMemo(() => ({ showToast, showSuccess, showError }), [showToast, showSuccess, showError]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed inset-x-4 bottom-4 sm:inset-x-auto sm:right-6 sm:bottom-6 z-[60] flex flex-col items-center sm:items-end gap-2 pointer-events-none print:hidden"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto w-full sm:w-auto sm:max-w-sm flex items-center gap-3 pl-4 pr-2 py-2.5 rounded-xl shadow-lg shadow-slate-900/20 bg-slate-900 text-white ring-1 ring-white/10 dark:bg-slate-800 animate-enter"
          >
            <svg className={`w-5 h-5 shrink-0 ${iconColor[toast.type]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICON_PATHS[toast.type]} />
            </svg>
            <p className="text-sm flex-1 py-0.5">{toast.message}</p>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action?.onClick();
                  removeToast(toast.id);
                }}
                className="shrink-0 rounded-md px-2.5 py-1 text-sm font-semibold text-indigo-300 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                {toast.action.label}
              </button>
            )}
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 rounded-md p-1.5 text-slate-400 hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              aria-label="Dismiss notification"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
