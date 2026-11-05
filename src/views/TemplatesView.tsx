import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useSeo, SEO_ROBOTS_INDEX, getSiteUrl } from '../hooks/useSeo';
import { LazyResumePreview } from '../components/LazyResumePreview';
import { SiteHeader, SiteFooter } from '../components/SiteHeader';
import { useResume } from '../contexts/ResumeContext';
import { TEMPLATES } from '../constants/templates';

const FILTERS = [
  { id: 'all', label: 'All', matches: () => true },
  { id: 'ats', label: 'ATS-friendly', matches: (t: Template) => t.atsFriendly },
  { id: 'creative', label: 'Two-column & creative', matches: (t: Template) => !t.atsFriendly },
  { id: 'photo', label: 'With photo', matches: (t: Template) => Boolean(t.photo) },
] as const;
type Template = (typeof TEMPLATES)[number];
type FilterId = (typeof FILTERS)[number]['id'];

const PhotoBadge: React.FC = () => <span className="tag">Photo</span>;

export const AtsBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`tag ${className}`}>
    ATS
  </span>
);

const TemplatesView: React.FC = () => {
  const { resumeData } = useResume();
  // The filter lives in the URL (/templates/?filter=photo) so a filtered list can be shared.
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = FILTERS.find((f) => f.id === searchParams.get('filter')) ?? FILTERS[0];
  const setFilter = (id: FilterId) => setSearchParams(id === 'all' ? {} : { filter: id }, { replace: true, preventScrollReset: true });
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/templates/`;
  const atsCount = TEMPLATES.filter((t) => t.atsFriendly).length;
  const description = `${TEMPLATES.length} free resume templates, ${atsCount} of them ATS-friendly. Inspired by Jake's Resume, Harvard, Awesome-CV and moderncv. Preview with your own content and download a PDF.`;

  const visible = useMemo(() => TEMPLATES.filter(filter.matches), [filter]);

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

  return (
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <Link className="focus-ring hover:text-ink" to="/">
            Home
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span className="text-ink" aria-current="page">
            Templates
          </span>
        </nav>
        <h1 className="mt-6 font-display text-[40px] font-semibold leading-[44px] tracking-display text-ink lg:text-[56px] lg:leading-[60px]">Resume templates</h1>
        <p className="mt-4 max-w-3xl text-base leading-[26px] text-muted">
          {TEMPLATES.length} free designs, each previewed with the resume in your editor. {atsCount} are single-column with standard headings, so
          applicant tracking systems (ATS) read them reliably, and {TEMPLATES.filter((t) => t.photo).length} show an optional photo for CVs in Europe and Asia. Every template supports your own accent colour, font and text size.
        </p>

        <div className="mt-8 inline-flex flex-wrap gap-1 rounded-lg border border-rule bg-tint p-1" role="group" aria-label="Filter templates">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter.id === f.id}
              onClick={() => setFilter(f.id)}
              className={`focus-ring h-8 rounded-md px-3 text-sm font-medium transition-colors ${
                filter.id === f.id ? 'bg-surface text-ink shadow-card ring-1 ring-rule' : 'text-muted hover:text-ink'
              }`}
            >
              {f.label}
              <span className="ml-1.5 tabular-nums text-muted">{TEMPLATES.filter(f.matches).length}</span>
            </button>
          ))}
        </div>

        <ul className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((t) => (
            <li key={t.id} className="group relative flex flex-col">
              {/* Stretched link instead of wrapping the preview: previews contain their own <a> elements. */}
              <div className="rounded-xl border border-rule bg-tint p-3 transition-[box-shadow,border-color] duration-200 group-hover:border-muted/30 group-hover:shadow-raised group-has-[:focus-visible]:outline-2 group-has-[:focus-visible]:outline-offset-2 group-has-[:focus-visible]:outline-accent sm:p-4"><div className="overflow-hidden rounded-[2px] bg-white shadow-card">
                <LazyResumePreview data={resumeData} templateId={t.id} />
              </div></div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <Link
                  to={`/templates/${t.id}/`}
                  className="font-display text-[15px] font-semibold text-ink after:absolute after:inset-0 focus-visible:outline-none"
                >
                  {t.name}
                </Link>
                {t.atsFriendly && <AtsBadge />}
                {t.photo && <PhotoBadge />}
              </div>
              <p className="mt-0.5 text-sm leading-5 text-muted">{t.description}</p>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
};

export default TemplatesView;
