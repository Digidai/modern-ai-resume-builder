import React, { useEffect, useState } from 'react';

/**
 * Progress of a slow task: numbered steps, the current status, elapsed time since it appeared, and a
 * bar (determinate when `percent` is given, pulsing otherwise). Mount it only while the task runs.
 */
export const TaskProgress: React.FC<{
  steps: readonly string[];
  step: number;
  status: string;
  percent: number | null;
  /** Accessible name of the progress bar. */
  label: string;
  note?: React.ReactNode;
  className?: string;
  'data-testid'?: string;
}> = ({ steps, step, status, percent, label, note, className = '', 'data-testid': testId }) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className={`space-y-2 rounded-lg border border-rule bg-tint px-4 py-3 text-sm ${className}`} data-testid={testId}>
      <ol className="flex items-center gap-2 text-xs text-muted" aria-hidden="true">
        {steps.map((name, index) => (
          <li key={name} className={`flex items-center gap-1.5 ${index <= step ? 'text-ink' : ''} ${index === step ? 'font-semibold' : ''}`}>
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold ${index < step ? 'bg-ink text-surface' : index === step ? 'border-2 border-ink bg-ink/10' : 'border border-rule'}`}
            >
              {index < step ? '✓' : index + 1}
            </span>
            {name}
            {index < steps.length - 1 && <span className="mx-1 h-px w-6 bg-rule" />}
          </li>
        ))}
      </ol>
      <div className="flex items-baseline justify-between gap-3">
        <p aria-live="polite" className="font-medium">
          {status}
        </p>
        <span className="shrink-0 tabular-nums text-xs text-muted">
          {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-rule/60" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent ?? undefined}>
        <div
          className={`h-full rounded-full bg-ink transition-[width] duration-300 ${percent === null ? 'w-1/4 animate-pulse' : ''}`}
          style={percent === null ? undefined : { width: `${percent}%` }}
        />
      </div>
      {note !== undefined && <p className="text-xs text-muted">{note}</p>}
    </div>
  );
};
