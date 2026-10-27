import React, { useMemo } from 'react';
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
  'focus-ring inline-flex h-11 items-center justify-center rounded-[2px] bg-ink px-5 text-[15px] font-medium text-paper transition-colors hover:bg-ink-hover';
const secondaryLinkClass =
  'focus-ring inline-flex h-11 items-center justify-center rounded-[2px] border border-ink px-5 text-[15px] font-medium text-ink transition-colors hover:bg-ink/5';

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

  const heroTemplate = TEMPLATES.find((t) => t.id === resumeData.templateId) ?? TEMPLATES.find((t) => t.id === 'modern');

  return (
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink">
      <SiteHeader ctaLabel={hasOwnResume ? 'Continue editing' : 'Create resume'} />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 md:pt-16 lg:grid-cols-[1.1fr_1fr] lg:gap-20 lg:pb-24">
          <div>
            <p className="kicker text-muted">Free · No account · A4 vector PDF</p>
            <h1 className="mt-5 font-display text-[40px] font-semibold leading-[44px] tracking-display text-ink sm:text-5xl sm:leading-[54px] lg:text-[56px] lg:leading-[60px]">
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

          <figure className="mx-auto w-full max-w-md lg:max-w-[460px]">
            {/* The overlay link is a sibling, not a wrapper: the resume itself contains links. */}
            <div className="group relative bg-white shadow-sheet has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-4 has-[a:focus-visible]:outline-accent">
              <SectionErrorBoundary sectionName="Resume Preview">
                <ScaledResumePreview data={resumeData} />
              </SectionErrorBoundary>
              <Link
                to="/editor"
                className="absolute inset-0 focus-visible:outline-none"
                aria-label={hasOwnResume ? 'Continue editing your resume' : 'Open the sample resume in the editor'}
              />
            </div>
            <figcaption className="mt-4 flex items-baseline justify-between gap-4 text-muted">
              <span className="kicker">
                {hasOwnResume ? 'Your resume' : 'Sample'} · {heroTemplate?.name}
              </span>
              <span className="kicker">210 × 297 mm</span>
            </figcaption>
          </figure>
        </section>

        {/* Facts */}
        <section className="border-y border-rule" aria-label="What you get">
          <dl className="mx-auto grid max-w-6xl gap-px bg-rule sm:grid-cols-2 lg:grid-cols-4">
            {FACTS.map((fact) => (
              <div key={fact.title} className="bg-paper px-4 py-6 sm:px-6 lg:py-8">
                <dt className="font-display text-xl font-semibold tracking-display text-ink">{fact.title}</dt>
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
            <Link to="/templates/" className="focus-ring shrink-0 text-sm font-medium text-accent underline underline-offset-4 hover:decoration-2">
              All {TEMPLATES.length} templates
            </Link>
          </div>
          <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {SHOWCASE_TEMPLATE_IDS.map((id) => {
              const template = TEMPLATES.find((t) => t.id === id);
              if (!template) return null;
              return (
                // The button overlays the card instead of wrapping it: previews contain their own links.
                <li key={id} className="group relative">
                  <div className="border border-rule bg-white transition-colors group-hover:border-ink group-has-[:focus-visible]:outline-2 group-has-[:focus-visible]:outline-offset-2 group-has-[:focus-visible]:outline-accent">
                    <LazyResumePreview data={resumeData} templateId={id} />
                  </div>
                  <p className="mt-3 flex items-baseline justify-between gap-2">
                    <span className="font-display text-base font-semibold text-ink">{template.name}</span>
                    {template.atsFriendly && <span className="kicker text-muted">ATS</span>}
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
          <ol className="mt-8 grid border-y border-rule md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className={`py-6 md:px-6 ${index === 0 ? 'md:pl-0' : 'border-t border-rule md:border-l md:border-t-0'}`}>
                <span className="kicker text-accent">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="mt-2 font-display text-xl font-semibold tracking-display text-ink">{step.title}</h3>
                <p className="mt-1.5 text-[15px] leading-6 text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto grid max-w-6xl scroll-mt-32 gap-8 px-4 py-16 sm:px-6 md:scroll-mt-20 lg:grid-cols-[1fr_2fr] lg:gap-16 lg:py-24">
          <h2 className="font-display text-[32px] font-semibold leading-[38px] tracking-display text-ink">Questions</h2>
          <div className="border-t border-rule">
            {HOME_FAQ_ITEMS.map((item) => (
              <details key={item.question} className="group border-b border-rule [&_summary::-webkit-details-marker]:hidden">
                <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[17px] font-medium text-ink">
                  {item.question}
                  <ChevronDownIcon className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
                </summary>
                <p className="-mt-1 pb-6 text-base leading-[26px] text-muted">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-rule bg-surface">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center">
            <p className="max-w-2xl font-display text-2xl font-semibold leading-8 tracking-display text-ink">
              It's free, there is no account, and you can download the PDF as often as you like.
            </p>
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
