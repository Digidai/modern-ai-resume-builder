import React from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useSeo, SEO_ROBOTS_INDEX, getSiteUrl } from '../hooks/useSeo';
import { ScaledResumePreview } from '../components/ScaledResumePreview';
import { LazyResumePreview } from '../components/LazyResumePreview';
import { SiteHeader, SiteFooter } from '../components/SiteHeader';
import { Button } from '../components/Button';
import { useResume } from '../contexts/ResumeContext';
import { TEMPLATES, getTemplateById } from '../constants/templates';
import roleGuideData from '../data/roleGuides.json';
import jobTitlesData from '../data/jobTitles.json';
import { slugifyJobTitle } from '../utils/slug';
import { AtsBadge } from './TemplatesView';
import NotFoundView from './NotFoundView';
import { AgentPromptCard } from '../components/AgentPromptCard';
import { buildAgentPrompt } from '../shared/agentPrompt.mjs';

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);
const CATEGORIES = jobTitlesData as { name: string; titles: string[] }[];
const GUIDES = roleGuideData.categories as Record<string, { templates: string[] }>;

/** Job titles from the categories whose writing guide recommends this template. */
const rolesFor = (templateId: string) =>
  CATEGORIES.filter((c) => GUIDES[c.name]?.templates.includes(templateId)).flatMap((c) => c.titles.slice(0, 4));

type Template = NonNullable<ReturnType<typeof getTemplateById>>;

const TemplateDetail: React.FC<{ template: Template }> = ({ template }) => {
  const templateId = template.id;
  const navigate = useNavigate();
  const { resumeData, setResumeData } = useResume();
  const siteUrl = getSiteUrl();

  const name = template.name;
  const pageUrl = `${siteUrl}/templates/${templateId}/`;
  const description = `${template.name} resume template: ${template.description}. ${template.atsFriendly ? 'ATS-friendly single column. ' : ''}Best for ${lowerFirst(template.bestFor)}. Free, with PDF export.`;

  useSeo({
    title: `${name} Resume Template${template.atsFriendly ? ' (ATS-Friendly)' : ''} | ModernCV`,
    description,
    canonical: `/templates/${templateId}/`,
    robots: SEO_ROBOTS_INDEX,
    ogImage: `/og/templates/${templateId}.jpg`,
    ogImageType: 'image/jpeg',
    imageAlt: `${name} resume template preview`,
    ldJson: {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebPage',
              '@id': `${pageUrl}#webpage`,
              name: `${name} resume template`,
              description,
              url: pageUrl,
              inLanguage: 'en',
              isPartOf: { '@id': `${siteUrl}/#website` },
              breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
              primaryImageOfPage: { '@type': 'ImageObject', url: `${siteUrl}/og/templates/${templateId}-page.jpg` },
            },
            {
              '@type': 'CreativeWork',
              '@id': `${pageUrl}#template`,
              name: `${name} resume template`,
              description,
              image: `${siteUrl}/og/templates/${templateId}-page.jpg`,
              isAccessibleForFree: true,
              encodingFormat: 'application/pdf',
              audience: { '@type': 'Audience', audienceType: template.bestFor },
              publisher: { '@id': `${siteUrl}/#organization` },
            },
            {
              '@type': 'BreadcrumbList',
              '@id': `${pageUrl}#breadcrumb`,
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
                { '@type': 'ListItem', position: 2, name: 'Templates', item: `${siteUrl}/templates/` },
                { '@type': 'ListItem', position: 3, name, item: pageUrl },
              ],
            },
          ],
        },
  });

  const index = TEMPLATES.findIndex((t) => t.id === template.id);
  const similar = TEMPLATES.filter((t) => t.id !== template.id && t.atsFriendly === template.atsFriendly).slice(0, 4);
  const roles = rolesFor(template.id).slice(0, 12);
  const prev = TEMPLATES[(index - 1 + TEMPLATES.length) % TEMPLATES.length];
  const next = TEMPLATES[(index + 1) % TEMPLATES.length];
  const useIt = () => {
    setResumeData((d) => ({ ...d, templateId: template.id }));
    navigate('/editor');
  };

  const facts: [string, React.ReactNode][] = [
    [
      'ATS',
      template.atsFriendly
        ? 'Friendly: single column, standard headings and real text in reading order.'
        : 'Use with care: multi-column or decorative layouts can confuse some applicant tracking systems. Great for email, portfolios and networking.',
    ],
    ['Best for', template.bestFor],
    ['Customize', 'Accent colour, font (10 options) and text size, plus fit-to-one-page.'],
    ['Export', 'Vector PDF with selectable text, or print from the browser. A4 page size.'],
  ];

  return (
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink">
      <SiteHeader />
      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-12 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="lg:col-start-2 lg:row-start-1">
          <nav aria-label="Breadcrumb" className="text-sm text-muted">
            <Link className="focus-ring hover:text-ink" to="/">
              Home
            </Link>
            <span className="mx-2" aria-hidden="true">
              /
            </span>
            <Link className="focus-ring hover:text-ink" to="/templates/">
              Templates
            </Link>
            <span className="mx-2" aria-hidden="true">
              /
            </span>
            <span className="text-ink" aria-current="page">
              {name}
            </span>
          </nav>
          <p className="kicker mt-6 text-muted">
            Template {index + 1} of {TEMPLATES.length}
            {template.atsFriendly ? ' · ATS-friendly' : ''}
          </p>
          <h1 className="mt-2 font-display text-[40px] font-semibold leading-[44px] tracking-display text-ink">{name} resume template</h1>
          <p className="mt-3 text-base leading-[26px] text-muted">{template.description}.</p>
          <Button className="mt-6 w-full sm:w-auto" size="lg" onClick={useIt}>
            Use this template
          </Button>

          <dl className="mt-8 divide-y divide-rule border-y border-rule text-sm">
            {facts.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 py-3">
                <dt className="kicker pt-0.5 text-muted">{label}</dt>
                <dd className="leading-6 text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          <AgentPromptCard className="mt-8" subject="a resume in this template" prompt={buildAgentPrompt({ siteUrl, template })} />

          {roles.length > 0 && (
            <section className="mt-8">
              <h2 className="kicker text-muted">Popular with</h2>
              <ul className="mt-2 columns-2 gap-6 text-sm">
                {roles.map((role) => (
                  <li key={role} className="break-inside-avoid py-1">
                    <Link to={`/resume_tmpl/${slugifyJobTitle(role)}/`} className="focus-ring text-ink hover:text-accent hover:underline hover:underline-offset-4">
                      {role}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <nav className="mt-8 flex justify-between gap-4 border-t border-rule pt-4 text-sm" aria-label="Other templates">
            <Link to={`/templates/${prev.id}/`} className="focus-ring font-medium text-muted hover:text-ink">
              ← {prev.name}
            </Link>
            <Link to={`/templates/${next.id}/`} className="focus-ring font-medium text-muted hover:text-ink">
              {next.name} →
            </Link>
          </nav>
        </div>

        <div className="lg:col-start-1 lg:row-start-1">
          <div className="mx-auto w-full max-w-[210mm] bg-white shadow-sheet">
            <ScaledResumePreview data={{ ...resumeData, templateId: template.id }} mode="page" />
          </div>
        </div>
      </main>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6" aria-labelledby="similar-heading">
        <div className="flex items-end justify-between gap-4 border-t border-rule pt-10">
          <h2 id="similar-heading" className="font-display text-[32px] font-semibold leading-[38px] tracking-display text-ink">
            Similar templates
          </h2>
          <Link to="/templates/" className="focus-ring shrink-0 text-sm font-medium text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent">
            All {TEMPLATES.length} templates
          </Link>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {similar.map((t) => (
            <li key={t.id} className="group relative">
              <div className="rounded-xl border border-rule bg-tint p-3 transition-[box-shadow,border-color] duration-200 group-hover:border-muted/30 group-hover:shadow-raised group-has-[:focus-visible]:outline-2 group-has-[:focus-visible]:outline-offset-2 group-has-[:focus-visible]:outline-accent sm:p-4"><div className="overflow-hidden rounded-[2px] bg-white shadow-card">
                <LazyResumePreview data={resumeData} templateId={t.id} />
              </div></div>
              <Link
                to={`/templates/${t.id}/`}
                className="mt-3 block font-display text-base font-semibold text-ink after:absolute after:inset-0 group-hover:text-accent focus-visible:outline-none"
              >
                {t.name}
              </Link>
              <p className="mt-0.5 text-sm leading-5 text-muted">{t.description}</p>
            </li>
          ))}
        </ul>
      </section>
      <SiteFooter />
    </div>
  );
};

const TemplateDetailView: React.FC = () => {
  const { templateId = '' } = useParams<{ templateId: string }>();
  const template = getTemplateById(templateId);
  return template ? <TemplateDetail key={template.id} template={template} /> : <NotFoundView />;
};

export default TemplateDetailView;
