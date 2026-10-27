import React from 'react';
import { Link } from 'react-router';
import { useSeo, SEO_ROBOTS_NOINDEX } from '../hooks/useSeo';
import { SiteHeader, SiteFooter } from '../components/SiteHeader';
import jobTitles from '../data/jobTitles.json';

const JOB_TITLE_COUNT = (jobTitles as { titles: string[] }[]).reduce((n, c) => n + c.titles.length, 0);

const links = [
  { to: '/editor/', label: 'Open the editor', body: 'Pick up where you left off — your resume is saved in this browser.' },
  { to: '/templates/', label: 'Browse templates', body: 'Compare every design with your own content.' },
  { to: '/directory/', label: 'Resume examples by job', body: `Example resumes and guides for ${JOB_TITLE_COUNT} job titles.` },
];

const NotFoundView: React.FC = () => {
  useSeo({
    title: 'Page not found | ModernCV',
    description: 'This page does not exist. Open the ModernCV resume editor or browse templates and job-title guides.',
    robots: SEO_ROBOTS_NOINDEX,
  });

  return (
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-20 sm:px-6">
        <p className="kicker text-muted">Error 404</p>
        <h1 className="mt-3 font-display text-[40px] font-semibold leading-[44px] tracking-display text-ink">We couldn't find that page</h1>
        <p className="mt-4 text-base leading-[26px] text-muted">The link may be old or mistyped. These pages are a good place to continue.</p>
        <ul className="mt-10 divide-y divide-rule border-y border-rule">
          {links.map((l) => (
            <li key={l.to}>
              <Link to={l.to} className="focus-ring group flex flex-col gap-0.5 py-4 sm:flex-row sm:items-baseline sm:gap-6">
                <span className="font-medium text-accent underline underline-offset-4 group-hover:decoration-2 sm:w-56 sm:shrink-0">{l.label}</span>
                <span className="text-sm text-muted">{l.body}</span>
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
