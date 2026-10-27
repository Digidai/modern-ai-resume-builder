import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { useSeo, SEO_ROBOTS_INDEX, getSiteUrl } from '../hooks/useSeo';
import { ScaledResumePreview } from '../components/ScaledResumePreview';
import { LazyResumePreview } from '../components/LazyResumePreview';
import { SparklesIcon, DownloadIcon, LayoutIcon, CheckIcon, EditIcon, BriefcaseIcon, ChevronDownIcon } from '../components/Icons';
import { SiteHeader, SiteFooter } from '../components/SiteHeader';
import { useResume } from '../contexts/ResumeContext';
import { SectionErrorBoundary } from '../components/ErrorBoundary';
import { buildHomeSeoKeywords, buildHomeFaqSchema, HOME_FAQ_ITEMS } from '../utils/seo';
import { INITIAL_RESUME_DATA, type ResumeData } from '../types';
import { TEMPLATES } from '../constants/templates';

const SHOWCASE_TEMPLATE_IDS = ['classic', 'modern', 'vanguard', 'timeline', 'banking', 'sidebar', 'creative', 'duo'];

const FEATURES = [
  {
    icon: <LayoutIcon className="h-5 w-5" />,
    title: `${TEMPLATES.length} recruiter-ready templates`,
    body: 'From quiet and classic to bold and modern. Switch any time without retyping a word.',
  },
  {
    icon: <SparklesIcon className="h-5 w-5" />,
    title: 'AI writing help',
    body: 'Draft a summary or tighten a bullet in one click, in the language you write in. You stay in control.',
  },
  {
    icon: <DownloadIcon className="h-5 w-5" />,
    title: 'Pixel-perfect PDF',
    body: 'Export a crisp A4 PDF with selectable text — exactly what you see in the preview.',
  },
  {
    icon: <CheckIcon className="h-5 w-5" />,
    title: 'Private by default',
    body: 'No sign-up. Your resume is saved in your browser and never stored on our servers.',
  },
];

const STEPS = [
  { title: 'Fill in your details', body: 'Start from the sample or a blank page. Autosave keeps every change.' },
  { title: 'Pick a template', body: 'Preview your own content in every design, live.' },
  { title: 'Download and apply', body: 'Get a print-ready PDF and a backup file you can edit later.' },
];

const isSampleResume = (data: ResumeData) =>
  JSON.stringify({ ...data, templateId: '' }) === JSON.stringify({ ...INITIAL_RESUME_DATA, templateId: '' });

const primaryLinkClass =
  'inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-base font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:ring-offset-slate-950';
const secondaryLinkClass =
  'inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 text-base font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-950';

const HomeView: React.FC = () => {
  const navigate = useNavigate();
  const { resumeData, setResumeData } = useResume();
  const hasOwnResume = useMemo(() => !isSampleResume(resumeData), [resumeData]);

  const siteUrl = getSiteUrl();
  const orgId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;
  const homeOgImage = '/og/home.png';
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

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <SiteHeader ctaLabel={hasOwnResume ? 'Continue editing' : 'Create resume'} />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.14),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.22),transparent_55%)]"
            aria-hidden="true"
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-24">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300">
                <SparklesIcon className="h-3.5 w-3.5" />
                Free · No sign-up · AI writing help
              </p>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
                A resume that gets you <span className="text-indigo-600 dark:text-indigo-400">the interview.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                Write it once, see it in {TEMPLATES.length} professional designs, and download a polished PDF in minutes.
                Everything stays in your browser.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/editor" className={primaryLinkClass}>
                  <EditIcon className="h-4 w-4" />
                  {hasOwnResume ? 'Continue editing' : 'Create my resume'}
                </Link>
                <Link to="/directory" className={secondaryLinkClass}>
                  <BriefcaseIcon className="h-4 w-4" />
                  Examples by job title
                </Link>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                {['ATS-friendly layouts', 'Selectable-text PDF', 'Works on your phone'].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <CheckIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="absolute -right-4 top-6 hidden w-[72%] rotate-6 overflow-hidden rounded-lg bg-white opacity-90 shadow-xl ring-1 ring-slate-900/5 sm:block" aria-hidden="true">
                <ScaledResumePreview data={resumeData} templateId={resumeData.templateId === 'creative' ? 'sidebar' : 'creative'} />
              </div>
              {/* The overlay link is a sibling, not a wrapper: the resume itself contains links. */}
              <div className="group relative overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-slate-900/10 transition hover:-translate-y-1 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-indigo-500 sm:w-[88%]">
                <SectionErrorBoundary sectionName="Resume Preview">
                  <ScaledResumePreview data={resumeData} />
                </SectionErrorBoundary>
                <Link
                  to="/editor"
                  className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-slate-900/70 via-transparent to-transparent pb-5 text-sm font-medium text-white opacity-0 transition hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
                  aria-label={hasOwnResume ? 'Continue editing your resume' : 'Open the sample resume in the editor'}
                >
                  {hasOwnResume ? 'Continue editing →' : 'Edit this resume →'}
                </Link>
              </div>
              {hasOwnResume && (
                <p className="mt-3 text-center text-xs text-slate-500 sm:w-[88%] dark:text-slate-400">Your resume, saved in this browser</p>
              )}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div key={feature.title}>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">
                  {feature.icon}
                </span>
                <h2 className="mt-4 font-semibold text-slate-900 dark:text-white">{feature.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Templates */}
        <section id="templates" className="mx-auto max-w-6xl scroll-mt-32 px-4 md:scroll-mt-20 py-16 sm:px-6 lg:py-24">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Pick a look. Keep your words.</h2>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                {hasOwnResume ? 'Previews use your own resume.' : 'Every template is shown with the same sample content.'} Click one to start editing.
              </p>
            </div>
            <Link to="/templates/" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
              See all {TEMPLATES.length} templates →
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {SHOWCASE_TEMPLATE_IDS.map((id) => {
              const template = TEMPLATES.find((t) => t.id === id);
              if (!template) return null;
              return (
                // The button overlays the card instead of wrapping it: previews contain their own links.
                <div key={id} className="group relative">
                  <div className="overflow-hidden rounded-lg bg-white shadow-md ring-1 ring-slate-900/5 transition group-hover:-translate-y-1 group-hover:shadow-xl group-has-[:focus-visible]:ring-2 group-has-[:focus-visible]:ring-indigo-500 dark:ring-white/10">
                    <LazyResumePreview data={resumeData} templateId={id} />
                  </div>
                  <span className="mt-3 flex items-center justify-between text-sm font-medium text-slate-800 dark:text-slate-200">
                    {template.name}
                    <span className="text-indigo-600 opacity-0 transition group-hover:opacity-100 group-has-[:focus-visible]:opacity-100 dark:text-indigo-400">Use →</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => useTemplate(id)}
                    aria-label={`Use the ${template.name} template`}
                    className="absolute inset-0 cursor-pointer rounded-lg focus-visible:outline-none"
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-slate-50 dark:bg-slate-900/40">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Done in three steps</h2>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-32 px-4 md:scroll-mt-20 py-16 sm:px-6 lg:py-24">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Questions</h2>
          <div className="mt-10 divide-y divide-slate-200 rounded-2xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {HOME_FAQ_ITEMS.map((item) => (
              <details key={item.question} className="group px-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-white">
                  {item.question}
                  <ChevronDownIcon className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto max-w-6xl rounded-3xl bg-slate-900 px-6 py-14 text-center dark:bg-indigo-950/60 dark:ring-1 dark:ring-indigo-900">
            <h2 className="text-3xl font-bold tracking-tight text-white">Your next job starts with one page.</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-300">It's free, it takes minutes, and you can download it as many times as you like.</p>
            <Link to="/editor" className={`${primaryLinkClass} mt-8`}>
              {hasOwnResume ? 'Continue editing' : 'Build my resume'}
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default HomeView;
