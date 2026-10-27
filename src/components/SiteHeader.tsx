import React from 'react';
import { Link, NavLink } from 'react-router';
import ThemeToggle from './ThemeToggle';

export const Logo: React.FC = () => (
  <Link
    to="/"
    className="flex items-center gap-2 rounded-lg text-lg font-bold tracking-tight text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-white"
  >
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-serif text-lg italic text-white shadow-sm">M</span>
    <span>
      Modern<span className="text-indigo-600 dark:text-indigo-400">CV</span>
    </span>
  </Link>
);

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
    isActive
      ? 'text-slate-900 dark:text-white'
      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
  }`;

/** Top bar shared by the marketing pages (home, directory, role pages). */
export const SiteHeader: React.FC<{ ctaLabel?: string }> = ({ ctaLabel = 'Open editor' }) => (
  <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/85 print:hidden">
    <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6">
      <Logo />
      <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Main">
        <NavLink to="/directory" className={navLinkClass}>
          Resume examples
        </NavLink>
        <NavLink to="/templates/" className={navLinkClass}>
          Templates
        </NavLink>
        <Link to="/#faq" className={navLinkClass({ isActive: false })}>
          FAQ
        </Link>
      </nav>
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <ThemeToggle />
        <Link
          to="/editor"
          className="inline-flex h-9 items-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:ring-offset-slate-950"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
    <nav className="flex gap-1 overflow-x-auto px-2 pb-1.5 md:hidden" aria-label="Main mobile">
      <NavLink to="/directory" className={navLinkClass}>
        Resume examples
      </NavLink>
      <NavLink to="/templates/" className={navLinkClass}>
        Templates
      </NavLink>
      <Link to="/#faq" className={navLinkClass({ isActive: false })}>
        FAQ
      </Link>
    </nav>
  </header>
);

export const SiteFooter: React.FC = () => (
  <footer className="border-t border-slate-200 dark:border-slate-800 print:hidden">
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:text-slate-400">
      <p>© {new Date().getFullYear()} ModernCV · Free resume builder. Your data stays in your browser.</p>
      <nav className="-mx-2 flex flex-wrap" aria-label="Footer">
        <Link to="/directory" className="rounded px-2 py-2 hover:text-slate-900 dark:hover:text-white">
          Resume examples
        </Link>
        <Link to="/templates/" className="rounded px-2 py-2 hover:text-slate-900 dark:hover:text-white">
          Templates
        </Link>
        <Link to="/editor" className="rounded px-2 py-2 hover:text-slate-900 dark:hover:text-white">
          Editor
        </Link>
        <a href="https://github.com/Digidai/modern-ai-resume-builder" className="rounded px-2 py-2 hover:text-slate-900 dark:hover:text-white" rel="noopener noreferrer" target="_blank">
          GitHub
        </a>
      </nav>
    </div>
  </footer>
);
