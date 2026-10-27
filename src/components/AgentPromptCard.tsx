import { useState } from 'react';
import { Link } from 'react-router';
import { ChevronDownIcon } from './Icons';

interface AgentPromptCardProps {
  prompt: string;
  /** What the prompt builds, e.g. "this template" or "a Nurse resume". */
  subject: string;
  className?: string;
  /** Start expanded (the agents page shows it open). */
  defaultOpen?: boolean;
}

/** A ready-made prompt that makes any AI agent build a resume with ModernCV's templates (MCP or API). */
export const AgentPromptCard = ({ prompt, subject, className = '', defaultOpen = false }: AgentPromptCardProps) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <details className={`group overflow-hidden rounded-xl border border-rule bg-surface shadow-card [&_summary::-webkit-details-marker]:hidden ${className}`} open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-tint focus-visible:bg-tint focus-visible:outline-none">
        <span>
          <span className="block text-base font-medium text-ink">Use with an AI agent</span>
          <span className="mt-0.5 block text-sm text-muted">A ready-made prompt to build {subject} in Claude, ChatGPT, Cursor or any agent.</span>
        </span>
        <ChevronDownIcon className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-rule px-5 pb-5 pt-4">
        <p className="text-sm leading-6 text-muted">
          It uses ModernCV's templates through our MCP server or API, then hands you the PDF and an editor link.
        </p>
        <div className="mt-3 overflow-hidden rounded-lg border border-rule bg-tint">
          <div className="flex items-center justify-between border-b border-rule px-3 py-2">
            <span className="kicker text-muted">Prompt</span>
            <button type="button" onClick={copy} className="focus-ring h-7 rounded-md border border-rule bg-surface px-2.5 text-xs font-medium text-ink shadow-card transition-colors hover:bg-tint" aria-live="polite">
              {copied ? 'Copied' : 'Copy prompt'}
            </button>
          </div>
          <pre className="max-h-56 overflow-auto whitespace-pre-wrap p-3 font-label text-xs leading-relaxed text-ink">{prompt}</pre>
        </div>
        <Link to="/agents/" className="focus-ring mt-3 inline-block text-sm font-medium text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent">
          Connect your agent (MCP, skill, API)
        </Link>
      </div>
    </details>
  );
};
