import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useSeo, SEO_ROBOTS_INDEX, getSiteUrl } from '../hooks/useSeo';
import { LazyResumePreview } from '../components/LazyResumePreview';
import { SiteHeader, SiteFooter } from '../components/SiteHeader';
import { useResume } from '../contexts/ResumeContext';
import { TEMPLATES } from '../constants/templates';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'ats', label: 'ATS-friendly' },
  { id: 'creative', label: 'Two-column & creative' },
] as const;
type FilterId = (typeof FILTERS)[number]['id'];

export const AtsBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span
    className={`rounded bg-emerald-50 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 ${className}`}
  >
    ATS
  </span>
);

const TemplatesView: React.FC = () => {
  const navigate = useNavigate();
  const { resumeData, setResumeData } = useResume();
  const [filter, setFilter] = useState<FilterId>('all');
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/templates/`;
  const atsCount = TEMPLATES.filter((t) => t.atsFriendly).length;
  const description = `${TEMPLATES.length} free resume templates, ${atsCount} of them ATS-friendly. Inspired by Jake's Resume, Harvard, Awesome-CV and moderncv. Preview with your own content and download a PDF.`;

  const visible = useMemo(
    () => TEMPLATES.filter((t) => (filter === 'all' ? true : filter === 'ats' ? t.atsFriendly : !t.atsFriendly)),
    [filter]
  );

  useSeo({
    title: `${TEMPLATES.length} Free Resume Templates (ATS-Friendly) | ModernCV`,
    description,
    canonical: '/templates/',
    robots: SEO_ROBOTS_INDEX,
    ogImage: '/og/templates/classic.jpg',
    ogImageType: 'image/jpeg',
    imageAlt: 'ModernCV resume templates',
    ldJson: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          '@id': `${pageUrl}#webpage`,
          name: 'Resume templates',
          description,
          url: pageUrl,
          inLanguage: 'en',
          isPartOf: { '@id': `${siteUrl}/#website` },
          breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: TEMPLATES.length,
            itemListElement: TEMPLATES.map((t, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: `${t.name} resume template`,
              url: `${siteUrl}/templates/${t.id}/`,
            })),
          },
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${pageUrl}#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
            { '@type': 'ListItem', position: 2, name: 'Templates', item: pageUrl },
          ],
        },
      ],
    },
  });

  const pickTemplate = (id: string) => {
    setResumeData((prev) => ({ ...prev, templateId: id }));
    navigate('/editor');
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans dark:bg-slate-950">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-500 dark:text-slate-400">
          <Link className="hover:text-slate-900 dark:hover:text-white" to="/">
            Home
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span className="text-slate-700 dark:text-slate-200" aria-current="page">
            Templates
          </span>
        </nav>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">Resume templates</h1>
        <p className="mt-3 max-w-3xl text-slate-600 dark:text-slate-400">
          {TEMPLATES.length} free designs, each previewed with the resume in your editor. {atsCount} are
          single-column with standard headings, so applicant tracking systems (ATS) read them reliably. Every template supports your own accent
          colour, font and text size.
        </p>

        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter templates">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`h-9 rounded-full px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                filter === f.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((t) => (
            <li key={t.id} className="flex flex-col">
              {/* Stretched link instead of wrapping the preview: previews contain their own <a> elements. */}
              <div className="group relative">
                <div className="overflow-hidden rounded-lg bg-white shadow-md ring-1 ring-slate-900/5 transition group-hover:-translate-y-0.5 group-hover:shadow-xl group-has-[:focus-visible]:ring-2 group-has-[:focus-visible]:ring-indigo-500 dark:ring-white/10">
                  <LazyResumePreview data={resumeData} templateId={t.id} />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Link
                    to={`/templates/${t.id}/`}
                    className="font-semibold text-slate-900 after:absolute after:inset-0 hover:text-indigo-600 focus-visible:outline-none dark:text-white dark:hover:text-indigo-400"
                  >
                    {t.name}
                  </Link>
                  {t.atsFriendly && <AtsBadge />}
                </div>
              </div>
              <p className="mt-1 flex-1 text-sm leading-snug text-slate-500 dark:text-slate-400">{t.description}</p>
              <button
                type="button"
                onClick={() => pickTemplate(t.id)}
                className="mt-3 h-9 self-start rounded-lg px-3 text-sm font-semibold text-indigo-600 ring-1 ring-indigo-200 transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300 dark:ring-indigo-500/30 dark:hover:bg-indigo-500/10"
              >
                Use template
              </button>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
};

export default TemplatesView;
