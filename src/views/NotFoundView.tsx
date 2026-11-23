import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useSeo, SEO_ROBOTS_NOINDEX } from '../hooks/useSeo';
import { SiteHeader, SiteFooter } from '../components/SiteHeader';
import jobTitles from '../data/jobTitles.json';
import { TEMPLATES } from '../constants/templates';
import { titleMatchRank } from '../utils/jobTitleSearch';
import { slugifyJobTitle } from '../utils/slug';

const ALL_TITLES = (jobTitles as { titles: string[] }[]).flatMap((c) => c.titles);
const JOB_TITLE_COUNT = ALL_TITLES.length.toLocaleString('en');

type Suggestion = { to: string; label: string };

/**
 * Pages a mistyped job-title or template URL probably meant: "/resume_tmpl/front-end-developer/" →
 * Frontend Developer, "/resume_tmpl/senior-registered-nurse/" → Registered Nurse (RN), "/templates/ledger/" → Ledger.
 */
export const suggestionsFor = (path: string): Suggestion[] => {
  const match = /^\/(resume_tmpl|templates)\/([^/]+)\/?$/.exec(path);
  if (!match) return [];
  let query: string;
  try {
    query = decodeURIComponent(match[2]).replace(/[-_+]+/g, ' ');
  } catch {
    return [];
  }
  if (match[1] === 'templates') {
    const named = TEMPLATES.filter((t) => titleMatchRank(t.name, query) === 1 || titleMatchRank(t.id, query) === 1);
    // "/templates/classic-2/" names Classic plus something else.
    return (named.length ? named : TEMPLATES.filter((t) => titleMatchRank(query, t.name) === 1))
      .slice(0, 3)
      .map((t) => ({ to: `/templates/${t.id}/`, label: `${t.name} template` }));
  }
  // Titles with every word of the URL, shortest first; failing that, titles whose words all appear in it, longest first.
  const byLength = (a: string, b: string) => a.length - b.length;
  const containing = ALL_TITLES.filter((title) => titleMatchRank(title, query) === 1).sort(byLength);
  const contained = ALL_TITLES.filter((title) => titleMatchRank(query, title.replace(/\([^)]*\)/g, ' ')) === 1).sort((a, b) => byLength(b, a));
  return (containing.length ? containing : contained).slice(0, 3).map((title) => ({ to: `/resume_tmpl/${slugifyJobTitle(title)}/`, label: `${title} resume example` }));
};

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

  // After hydration: the prerendered 404 shell is the same for every URL.
  const { pathname } = useLocation();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  useEffect(() => setSuggestions(suggestionsFor(pathname.toLowerCase())), [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-20 sm:px-6">
        <p className="kicker text-muted">Error 404</p>
        <h1 className="mt-3 font-display text-[40px] font-semibold leading-[44px] tracking-display text-ink">We couldn't find that page</h1>
        <p className="mt-4 text-base leading-[26px] text-muted">The link may be old or mistyped. These pages are a good place to continue.</p>
        {suggestions.length > 0 && (
          <section className="mt-10" aria-labelledby="did-you-mean">
            <h2 id="did-you-mean" className="text-sm font-semibold text-ink">
              Did you mean
            </h2>
            <ul className="mt-3 flex flex-col gap-2">
              {suggestions.map((s) => (
                <li key={s.to}>
                  <Link to={s.to} className="focus-ring font-medium text-accent underline underline-offset-4 hover:decoration-accent">
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        <ul className="mt-10 divide-y divide-rule border-y border-rule">
          {links.map((l) => (
            <li key={l.to}>
              <Link to={l.to} className="focus-ring group flex flex-col gap-0.5 py-4 sm:flex-row sm:items-baseline sm:gap-6">
                <span className="font-medium text-accent underline underline-offset-4 group-hover:decoration-accent sm:w-56 sm:shrink-0">{l.label}</span>
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
