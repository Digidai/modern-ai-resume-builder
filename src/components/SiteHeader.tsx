import React from 'react';
import { Link, NavLink } from 'react-router';
import ThemeToggle from './ThemeToggle';

export const Logo: React.FC = () => (
  <Link to="/" className="focus-ring rounded-[2px] font-display text-[22px] font-semibold leading-none tracking-display text-ink">
    ModernCV
  </Link>
);

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `focus-ring shrink-0 whitespace-nowrap border-b-2 py-1 text-sm transition-colors ${
    isActive ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'
  }`;

const NavItems: React.FC = () => (
  <>
    <NavLink to="/directory" className={navLinkClass}>
      Resume examples
    </NavLink>
    <NavLink to="/templates/" className={navLinkClass}>
      Templates
    </NavLink>
    <NavLink to="/agents/" className={navLinkClass}>
      AI agents
    </NavLink>
    <Link to="/#faq" className={navLinkClass({ isActive: false })}>
      FAQ
    </Link>
  </>
);

/** Top bar shared by the marketing pages (home, directory, role pages). */
export const SiteHeader: React.FC<{ ctaLabel?: string }> = ({ ctaLabel = 'Open editor' }) => (
  <header className="sticky top-0 z-30 border-b border-rule bg-paper/95 backdrop-blur-sm print:hidden">
    <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6">
      <Logo />
      <nav className="ml-10 hidden items-center gap-7 md:flex" aria-label="Main">
        <NavItems />
      </nav>
      <div className="ml-auto flex items-center gap-1 sm:gap-3">
        <ThemeToggle />
        <Link
          to="/editor"
          className="focus-ring inline-flex h-9 items-center rounded-[2px] bg-ink px-4 text-sm font-medium text-paper transition-colors hover:bg-ink-hover"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
    <nav className="flex gap-6 overflow-x-auto px-4 pb-2 md:hidden" aria-label="Main mobile">
      <NavItems />
    </nav>
  </header>
);

const footerLink = 'focus-ring rounded-[2px] py-1 hover:text-ink';

export const SiteFooter: React.FC = () => (
  <footer className="border-t border-rule print:hidden">
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p>
        © {new Date().getFullYear()} <span className="font-display font-semibold text-ink">ModernCV</span> · Free resume builder. Your data stays in your browser.
      </p>
      <nav className="flex flex-wrap gap-x-5 gap-y-1" aria-label="Footer">
        <Link to="/directory" className={footerLink}>
          Resume examples
        </Link>
        <Link to="/templates/" className={footerLink}>
          Templates
        </Link>
        <Link to="/editor" className={footerLink}>
          Editor
        </Link>
        <Link to="/agents/" className={footerLink}>
          AI agents
        </Link>
        <a href="https://github.com/Digidai/modern-ai-resume-builder" className={footerLink} rel="noopener noreferrer" target="_blank">
          GitHub
        </a>
      </nav>
    </div>
  </footer>
);
