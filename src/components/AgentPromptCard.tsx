import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from './Button';
import { CheckIcon, FileIcon, SparklesIcon } from './Icons';

interface AgentPromptCardProps {
  prompt: string;
  /** What the prompt builds, e.g. "this template" or "a Nurse resume". */
  subject: string;
  className?: string;
}

/** A ready-made prompt that makes any AI agent build a resume with ModernCV's templates (MCP or API). */
export const AgentPromptCard = ({ prompt, subject, className = '' }: AgentPromptCardProps) => {
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
    <section className={`rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5 dark:border-indigo-900/60 dark:bg-indigo-950/30 ${className}`} aria-labelledby="agent-prompt-heading">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="agent-prompt-heading" className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <SparklesIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            Build {subject} with an AI agent
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Paste this prompt into Claude, ChatGPT, Cursor or any agent. It uses ModernCV's templates through our MCP server or API, then hands you the PDF and an editor link.
          </p>
        </div>
      </div>
      <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-indigo-100 bg-white p-3 font-mono text-xs leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        {prompt}
      </pre>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={copy} leftIcon={copied ? <CheckIcon className="h-4 w-4" /> : <FileIcon className="h-4 w-4" />} aria-live="polite">
          {copied ? 'Copied' : 'Copy prompt'}
        </Button>
        <Link to="/agents/" className="text-sm font-medium text-indigo-700 hover:underline dark:text-indigo-300">
          Connect your agent (MCP, skill, API) →
        </Link>
      </div>
    </section>
  );
};
