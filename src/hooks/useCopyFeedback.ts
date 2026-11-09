import { useCallback, useEffect, useRef, useState } from 'react';

export type CopyState = 'idle' | 'copied' | 'failed';

const FEEDBACK_MS = 2000;

/**
 * Copies text to the clipboard and reports the outcome for 2 s, then goes back to idle.
 * A second click restarts the 2 s, so the label doesn't flip back early.
 */
export const useCopyFeedback = (text: string): [CopyState, () => Promise<void>] => {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = useCallback(async () => {
    let next: CopyState = 'copied';
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      next = 'failed';
    }
    window.clearTimeout(timer.current);
    setState(next);
    timer.current = window.setTimeout(() => setState('idle'), FEEDBACK_MS);
  }, [text]);

  return [state, copy];
};

/** The button label for each state: `idle` is the component's own wording. */
export const copyLabel = (state: CopyState, idle: string) => (state === 'copied' ? 'Copied' : state === 'failed' ? "Couldn't copy" : idle);
