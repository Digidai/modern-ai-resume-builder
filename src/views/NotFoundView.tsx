import React from 'react';
import { Link } from 'react-router';
import { useSeo, SEO_ROBOTS_NOINDEX } from '../hooks/useSeo';
import { SiteHeader, SiteFooter } from '../components/SiteHeader';

const links = [
  { to: '/editor/', label: 'Open the editor', body: 'Pick up where you left off — your resume is saved in this browser.' },
  { to: '/templates/', label: 'Browse templates', body: 'Compare every design with your own content.' },
  { to: '/directory/', label: 'Resume examples by job', body: 'Guides and templates for 640 job titles.' },
];

const NotFoundView: React.FC = () => {
  useSeo({
    title: 'Page not found | ModernCV',
    description: 'This page does not exist. Open the ModernCV resume editor or browse templates and job-title guides.',
    robots: SEO_ROBOTS_NOINDEX,
  });

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans dark:bg-slate-950">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-20 text-center sm:px-6">
        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">We couldn't find that page</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">The link may be old or mistyped. Here are some good places to go instead.</p>
        <ul className="mt-10 grid gap-4 text-left sm:grid-cols-3">
          {links.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                className="block h-full rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/40"
              >
                <span className="font-semibold text-slate-900 dark:text-white">{l.label} →</span>
                <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">{l.body}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
};

export default NotFoundView;
