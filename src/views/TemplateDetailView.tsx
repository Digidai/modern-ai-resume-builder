import React from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useSeo, SEO_ROBOTS_INDEX, getSiteUrl } from '../hooks/useSeo';
import { ScaledResumePreview } from '../components/ScaledResumePreview';
import { LazyResumePreview } from '../components/LazyResumePreview';
import { SiteHeader, SiteFooter } from '../components/SiteHeader';
import { Button } from '../components/Button';
import { CheckIcon } from '../components/Icons';
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
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans dark:bg-slate-950">
      <SiteHeader />
      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="lg:col-start-2 lg:row-start-1">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-500 dark:text-slate-400">
            <Link className="hover:text-slate-900 dark:hover:text-white" to="/">
              Home
            </Link>
            <span className="mx-2" aria-hidden="true">
              /
            </span>
            <Link className="hover:text-slate-900 dark:hover:text-white" to="/templates/">
              Templates
            </Link>
            <span className="mx-2" aria-hidden="true">
              /
            </span>
            <span className="text-slate-700 dark:text-slate-200" aria-current="page">
              {name}
            </span>
          </nav>
          <h1 className="mt-4 flex flex-wrap items-center gap-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {name} resume template {template.atsFriendly && <AtsBadge className="text-xs" />}
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">{template.description}.</p>
          <Button className="mt-6 w-full sm:w-auto" size="lg" onClick={useIt} leftIcon={<CheckIcon className="h-4 w-4" />}>
            Use this template
          </Button>

          <dl className="mt-8 space-y-4 text-sm">
            {facts.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[88px_minmax(0,1fr)] gap-3">
                <dt className="font-semibold text-slate-900 dark:text-white">{label}</dt>
                <dd className="text-slate-600 dark:text-slate-400">{value}</dd>
              </div>
            ))}
          </dl>

          <AgentPromptCard className="mt-8" subject="a resume in this template" prompt={buildAgentPrompt({ siteUrl, template })} />

          {roles.length > 0 && (
            <section className="mt-8">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Popular with</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {roles.map((role) => (
                  <li key={role}>
                    <Link
                      to={`/resume_tmpl/${slugifyJobTitle(role)}/`}
                      className="inline-block rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-indigo-300"
                    >
                      {role}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <nav className="mt-8 flex justify-between gap-4 border-t border-slate-200 pt-4 text-sm dark:border-slate-800" aria-label="Other templates">
            <Link to={`/templates/${prev.id}/`} className="font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
              ← {prev.name}
            </Link>
            <Link to={`/templates/${next.id}/`} className="font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
              {next.name} →
            </Link>
          </nav>
        </div>

        <div className="lg:col-start-1 lg:row-start-1">
          <div className="mx-auto w-full max-w-[210mm] shadow-xl ring-1 ring-slate-900/5">
            <ScaledResumePreview data={{ ...resumeData, templateId: template.id }} mode="page" />
          </div>
        </div>
      </main>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6" aria-labelledby="similar-heading">
        <h2 id="similar-heading" className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Similar templates
        </h2>
        <ul className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-4">
          {similar.map((t) => (
            <li key={t.id} className="group relative">
              <div className="overflow-hidden rounded-lg bg-white shadow-md ring-1 ring-slate-900/5 transition group-hover:-translate-y-0.5 group-hover:shadow-xl group-has-[:focus-visible]:ring-2 group-has-[:focus-visible]:ring-indigo-500 dark:ring-white/10">
                <LazyResumePreview data={resumeData} templateId={t.id} />
              </div>
              <Link
                to={`/templates/${t.id}/`}
                className="mt-2 block text-sm font-medium text-slate-800 after:absolute after:inset-0 focus-visible:outline-none dark:text-slate-200"
              >
                {t.name}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-8">
          <Link to="/templates/" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
            See all {TEMPLATES.length} templates →
          </Link>
        </p>
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
