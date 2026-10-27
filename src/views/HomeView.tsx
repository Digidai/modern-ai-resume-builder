import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useSeo, SEO_ROBOTS_INDEX, getSiteUrl } from '../hooks/useSeo';
import { ScaledResumePreview } from '../components/ScaledResumePreview';
import { LazyResumePreview } from '../components/LazyResumePreview';
import { ChevronDownIcon } from '../components/Icons';
import { SiteHeader, SiteFooter } from '../components/SiteHeader';
import { useResume } from '../contexts/ResumeContext';
import { SectionErrorBoundary } from '../components/ErrorBoundary';
import { buildHomeSeoKeywords, buildHomeFaqSchema, HOME_FAQ_ITEMS } from '../utils/seo';
import { INITIAL_RESUME_DATA, type ResumeData } from '../types';
import { TEMPLATES } from '../constants/templates';
import jobTitlesData from '../data/jobTitles.json';

const HERO_TEMPLATE_IDS = ['modern', 'classic', 'timeline', 'sidebar'];
const SHOWCASE_TEMPLATE_IDS = ['classic', 'modern', 'vanguard', 'timeline', 'banking', 'sidebar', 'creative', 'duo'];

const ATS_COUNT = TEMPLATES.filter((t) => t.atsFriendly).length;
const EXAMPLE_COUNT = (jobTitlesData as { titles: string[] }[]).reduce((n, c) => n + c.titles.length, 0);

const FACTS = [
  { title: `${TEMPLATES.length} templates`, body: `${ATS_COUNT} single-column and ATS-friendly, the rest two-column or expressive.` },
  { title: `${EXAMPLE_COUNT} resume examples`, body: 'One complete example and writing guide per job title.' },
  { title: 'A4 vector PDF', body: 'Selectable text and embedded fonts, matching the preview.' },
  { title: 'Stays in your browser', body: 'No account. Your draft is saved locally until you delete it.' },
];

const STEPS = [
  { title: 'Fill in your details', body: 'Start from the sample or a blank page. Changes save as you type.' },
  { title: 'Pick a template', body: 'Every design previews your own content, so you can compare them side by side.' },
  { title: 'Download the PDF', body: 'Export an A4 PDF, plus a JSON backup if you want to edit it later.' },
];

const isSampleResume = (data: ResumeData) =>
  JSON.stringify({ ...data, templateId: '' }) === JSON.stringify({ ...INITIAL_RESUME_DATA, templateId: '' });

const primaryLinkClass =
  'focus-ring inline-flex h-11 items-center justify-center rounded-lg bg-ink px-5 text-[15px] font-medium text-paper shadow-button transition-colors hover:bg-ink-hover';
const secondaryLinkClass =
  'focus-ring inline-flex h-11 items-center justify-center rounded-lg border border-rule bg-surface shadow-card px-5 text-[15px] font-medium text-ink transition-colors hover:bg-tint';

const HomeView: React.FC = () => {
  const navigate = useNavigate();
  const { resumeData, setResumeData } = useResume();
  const hasOwnResume = useMemo(() => !isSampleResume(resumeData), [resumeData]);

  const siteUrl = getSiteUrl();
  const orgId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;
  const homeOgImage = '/og-image.png';
  const homeOgImageUrl = `${siteUrl}${homeOgImage}`;

  useSeo({
    title: 'ModernCV - Free AI Resume Builder | Create Professional Resumes Online',
    description:
      "Create stunning professional resumes in minutes with ModernCV's free AI-powered resume builder. Choose templates, get AI suggestions, and download as PDF instantly.",
    keywords: buildHomeSeoKeywords(),
    canonical: '/',
    robots: SEO_ROBOTS_INDEX,
    ogImage: homeOgImage,
    imageAlt: 'ModernCV AI resume builder preview',
    ldJson: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': orgId,
          name: 'ModernCV',
          url: `${siteUrl}/`,
          logo: { '@type': 'ImageObject', url: `${siteUrl}/apple-touch-icon.png` },
        },
        {
          '@type': 'WebSite',
          '@id': websiteId,
          name: 'ModernCV',
          url: `${siteUrl}/`,
          inLanguage: 'en',
          potentialAction: {
            '@type': 'SearchAction',
            target: `${siteUrl}/directory/?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        },
        {
          '@type': 'WebApplication',
          name: 'ModernCV',
          description: 'Free AI-powered resume builder to create professional resumes online',
          url: `${siteUrl}/`,
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          featureList: [`${TEMPLATES.length} resume templates, ${TEMPLATES.filter((t) => t.atsFriendly).length} ATS-friendly`, 'AI summary and bullet point writing', 'Vector PDF export', 'Custom accent colour, font and text size', 'JSON Resume import', 'No sign-up; data stays in the browser'],
          screenshot: homeOgImageUrl,
          publisher: { '@id': orgId },
          isPartOf: { '@id': websiteId },
        },
        {
          '@type': 'WebPage',
          '@id': `${siteUrl}/#webpage`,
          name: 'ModernCV - Free AI Resume Builder',
          description: "Create stunning professional resumes in minutes with ModernCV's free AI-powered resume builder.",
          url: `${siteUrl}/`,
          inLanguage: 'en',
          isPartOf: { '@id': websiteId },
          primaryImageOfPage: { '@type': 'ImageObject', url: homeOgImageUrl },
        },
        buildHomeFaqSchema(siteUrl),
      ],
    },
  });

  const useTemplate = (templateId: string) => {
    setResumeData((prev) => ({ ...prev, templateId }));
    navigate('/editor');
  };

  const [heroTemplateId, setHeroTemplateId] = useState(() =>
    hasOwnResume && TEMPLATES.some((t) => t.id === resumeData.templateId) ? resumeData.templateId : 'modern',
  );
  const heroTemplate = TEMPLATES.find((t) => t.id === heroTemplateId);

  return (
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink">
      <SiteHeader ctaLabel={hasOwnResume ? 'Continue editing' : 'Create resume'} />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-rule bg-surface px-3 py-1 text-[13px] font-medium text-muted shadow-card">
              <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
              Free · No account · A4 vector PDF
            </p>
            <h1 className="mt-6 font-display text-[40px] font-semibold leading-[44px] tracking-display text-ink sm:text-5xl sm:leading-[54px] lg:text-[60px] lg:leading-[64px]">
              Write your resume once. Set it in any of {TEMPLATES.length} templates.
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-[28px] text-muted">
              Type your experience on the left and see it typeset on an A4 page on the right. Download a PDF with selectable text when it reads
              well. Nothing to sign up for; your draft is saved in this browser.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/editor" className={primaryLinkClass}>
                {hasOwnResume ? 'Continue editing' : 'Create my resume'}
              </Link>
              <Link to="/directory" className={secondaryLinkClass}>
                Browse examples by job
              </Link>
            </div>
          </div>

          <figure className="mx-auto w-full max-w-md rounded-2xl border border-rule bg-tint p-4 sm:p-6 lg:max-w-[500px]">
            <div className="mb-4 flex flex-wrap items-center gap-1.5" role="group" aria-label="Preview template">
              {HERO_TEMPLATE_IDS.map((id) => {
                const t = TEMPLATES.find((x) => x.id === id);
                const active = id === heroTemplateId;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setHeroTemplateId(id)}
                    className={`focus-ring h-7 rounded-md px-2.5 text-[13px] font-medium transition-colors ${
                      active ? 'bg-surface text-ink shadow-card ring-1 ring-rule' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {t?.name}
                  </button>
                );
              })}
            </div>
            {/* The overlay link is a sibling, not a wrapper: the resume itself contains links. */}
            <div className="group relative overflow-hidden rounded-[3px] bg-white shadow-sheet has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-4 has-[a:focus-visible]:outline-accent">
              <SectionErrorBoundary sectionName="Resume Preview">
                <ScaledResumePreview data={resumeData} templateId={heroTemplateId} />
              </SectionErrorBoundary>
              <Link
                to="/editor"
                className="absolute inset-0 focus-visible:outline-none"
                aria-label={hasOwnResume ? 'Continue editing your resume' : 'Open the sample resume in the editor'}
              />
            </div>
            <figcaption className="mt-4 flex items-baseline justify-between gap-4 text-muted">
              <span className="kicker">
                {hasOwnResume ? 'Your resume' : 'Sample resume'} · {heroTemplate?.name}
              </span>
              <span className="kicker">A4 · 210 × 297 mm</span>
            </figcaption>
          </figure>
        </section>

        {/* Facts */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6" aria-label="What you get">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FACTS.map((fact) => (
              <div key={fact.title} className="rounded-xl border border-rule bg-surface p-5 shadow-card">
                <dt className="font-display text-lg font-semibold tracking-display text-ink">{fact.title}</dt>
                <dd className="mt-1.5 text-sm leading-6 text-muted">{fact.body}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Templates */}
        <section id="templates" className="mx-auto max-w-6xl scroll-mt-32 px-4 py-16 sm:px-6 md:scroll-mt-20 lg:py-24">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-display text-[32px] font-semibold leading-[38px] tracking-display text-ink">The same resume, eight ways</h2>
              <p className="mt-3 max-w-2xl text-base leading-[26px] text-muted">
                {hasOwnResume ? 'These previews use your own resume.' : 'Each design below shows the same sample content.'} Choose one to open it in the editor.
              </p>
            </div>
            <Link to="/templates/" className={`${secondaryLinkClass} h-10! text-sm! shrink-0`}>
              All {TEMPLATES.length} templates
            </Link>
          </div>
          <ul className="mt-10 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {SHOWCASE_TEMPLATE_IDS.map((id) => {
              const template = TEMPLATES.find((t) => t.id === id);
              if (!template) return null;
              return (
                // The button overlays the card instead of wrapping it: previews contain their own links.
                <li key={id} className="group relative">
                  <div className="rounded-xl border border-rule bg-tint p-3 transition-[box-shadow,border-color] duration-200 group-hover:border-muted/30 group-hover:shadow-raised group-has-[:focus-visible]:outline-2 group-has-[:focus-visible]:outline-offset-2 group-has-[:focus-visible]:outline-accent sm:p-4">
                    <div className="overflow-hidden rounded-[2px] bg-white shadow-card">
                      <LazyResumePreview data={resumeData} templateId={id} />
                    </div>
                  </div>
                  <p className="mt-3 flex items-center justify-between gap-2">
                    <span className="font-display text-[15px] font-semibold text-ink">{template.name}</span>
                    {template.atsFriendly && <span className="tag">ATS</span>}
                  </p>
                  <p className="mt-0.5 text-sm leading-5 text-muted">{template.description}</p>
                  <button
                    type="button"
                    onClick={() => useTemplate(id)}
                    aria-label={`Use the ${template.name} template`}
                    className="absolute inset-0 cursor-pointer focus-visible:outline-none"
                  />
                </li>
              );
            })}
          </ul>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-[32px] font-semibold leading-[38px] tracking-display text-ink">How it works</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-xl border border-rule bg-surface p-6 shadow-card">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-tint text-[13px] font-semibold text-ink ring-1 ring-rule">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold tracking-display text-ink">{step.title}</h3>
                <p className="mt-1.5 text-[15px] leading-6 text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto grid max-w-6xl scroll-mt-32 gap-8 px-4 py-16 sm:px-6 md:scroll-mt-20 lg:grid-cols-[1fr_2fr] lg:gap-16 lg:py-24">
          <div>
            <h2 className="font-display text-[32px] font-semibold leading-[38px] tracking-display text-ink">Questions</h2>
            <p className="mt-3 text-base leading-[26px] text-muted">Everything about privacy, PDFs and templates.</p>
          </div>
          <div className="divide-y divide-rule overflow-hidden rounded-xl border border-rule bg-surface shadow-card">
            {HOME_FAQ_ITEMS.map((item) => (
              <details key={item.question} className="group [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-base font-medium text-ink transition-colors hover:bg-tint focus-visible:bg-tint focus-visible:outline-none sm:px-6">
                  {item.question}
                  <ChevronDownIcon className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
                </summary>
                <p className="px-5 pb-5 text-[15px] leading-[25px] text-muted sm:px-6">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:pb-24">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-rule bg-surface p-8 shadow-card md:flex-row md:items-center md:p-10">
            <div>
              <p className="font-display text-2xl font-semibold leading-8 tracking-display text-ink">Ready when you are.</p>
              <p className="mt-1.5 text-base text-muted">Free, no account, and you can download the PDF as often as you like.</p>
            </div>
            <Link to="/editor" className={`${primaryLinkClass} shrink-0`}>
              {hasOwnResume ? 'Continue editing' : 'Start my resume'}
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default HomeView;
