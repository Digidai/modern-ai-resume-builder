import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeo, SEO_ROBOTS_INDEX, getSiteUrl } from '../hooks/useSeo';
import ResumePreview from '../components/ResumePreview';
import { DownloadIcon, EditIcon, BriefcaseIcon } from '../components/Icons';
import { Button } from '../components/Button';
import ThemeToggle from '../components/ThemeToggle';
import { useResume } from '../contexts/ResumeContext';
import { SectionErrorBoundary } from '../components/ErrorBoundary';
import { buildHomeSeoKeywords, buildHomeFaqSchema } from '../utils/seo';

const HomeView: React.FC = () => {
  const navigate = useNavigate();
  const { resumeData, handleDownloadPdf, isExportingPdf, saveError, saveStatus } = useResume();

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
          logo: {
            '@type': 'ImageObject',
            url: `${siteUrl}/apple-touch-icon.png`,
          },
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
          featureList: [
            'AI-powered resume suggestions',
            'Multiple professional templates',
            'PDF export',
            'Real-time preview',
            'Dark mode support',
          ],
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
          primaryImageOfPage: {
            '@type': 'ImageObject',
            url: homeOgImageUrl,
          },
        },
        buildHomeFaqSchema(siteUrl),
      ],
    },
  });

  return (
    <div className="min-h-screen bg-slate-200 dark:bg-slate-950 font-sans print:bg-white flex flex-col transition-colors duration-300">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-4 px-6 md:px-12 print:hidden sticky top-0 z-10 transition-colors">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-serif italic text-lg">M</span>
            Modern<span className="text-indigo-600 dark:text-indigo-400">CV</span>
          </h1>
          <div className="flex gap-3">
            <ThemeToggle />
            <Button
              onClick={() => navigate('/directory')}
              variant="ghost"
              className="hidden md:flex text-slate-600 dark:text-slate-300"
              leftIcon={<BriefcaseIcon className="w-4 h-4" />}
            >
              Job Directory
            </Button>
            <Button
              onClick={handleDownloadPdf}
              variant="ghost"
              className="hidden md:flex"
              leftIcon={<DownloadIcon className="w-4 h-4" />}
              isLoading={isExportingPdf}
            >
              Download PDF
            </Button>
            <Button
              onClick={() => navigate('/editor')}
              variant="primary"
              leftIcon={<EditIcon className="w-4 h-4" />}
            >
              Edit Resume
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 print:p-0">
        <div className="max-w-[21cm] mx-auto mb-4 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600" role="status" aria-live="polite">
          {saveStatus === 'saving' && 'Saving changes...'}
          {saveStatus === 'saved' && 'All changes saved locally.'}
          {saveStatus === 'error' && 'Autosave failed. Check warning below.'}
          {saveStatus === 'idle' && 'Autosave is active.'}
        </div>
        {saveError && (
          <div
            role="alert"
            className="max-w-[21cm] mx-auto mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            Autosave warning: {saveError}. Changes may not persist in this browser tab.
          </div>
        )}
        <div className="max-w-[21cm] mx-auto shadow-2xl print:shadow-none transition-transform duration-500 ease-out animate-in fade-in slide-in-from-bottom-4">
          <SectionErrorBoundary sectionName="Resume Preview">
            <ResumePreview data={resumeData} showFullPage={false} />
          </SectionErrorBoundary>
        </div>
        <div className="h-20 md:hidden print:hidden"></div>
      </main>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 md:hidden print:hidden flex gap-3">
        <Button
          onClick={() => navigate('/directory')}
          variant="secondary"
          className="rounded-full shadow-xl"
          title="Job Directory"
          aria-label="Open job directory"
        >
          <BriefcaseIcon className="w-5 h-5" />
        </Button>
        <Button
          onClick={handleDownloadPdf}
          variant="secondary"
          className="rounded-full shadow-xl"
          title="Download PDF"
          aria-label="Download resume as PDF"
          isLoading={isExportingPdf}
        >
          <DownloadIcon className="w-5 h-5" />
        </Button>
        <Button
          onClick={() => navigate('/editor')}
          variant="primary"
          className="rounded-full shadow-xl"
          leftIcon={<EditIcon className="w-4 h-4" />}
        >
          Edit Resume
        </Button>
      </div>
    </div>
  );
};

export default HomeView;
