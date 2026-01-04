import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeo, SEO_ROBOTS_NOINDEX, getSiteUrl } from '../hooks/useSeo';
import ResumePreview from '../components/ResumePreview';
import ResumeEditor from '../components/ResumeEditor';
import { DownloadIcon, CheckIcon, ArrowLeftIcon, SaveIcon } from '../components/Icons';
import { Button } from '../components/Button';
import ThemeToggle from '../components/ThemeToggle';
import { useResume } from '../contexts/ResumeContext';
import { SectionErrorBoundary } from '../components/ErrorBoundary';

const EditorView: React.FC = () => {
  const navigate = useNavigate();
  const { resumeData, setResumeData, resetData, handleDownloadPdf, handleExportJson, isExportingPdf } = useResume();
  const [isPreviewModeMobile, setIsPreviewModeMobile] = useState(false);

  const siteUrl = getSiteUrl();
  const orgId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;
  const pageUrl = `${siteUrl}/editor`;
  const editorOgImage = '/og/editor.png';
  const editorOgImageUrl = `${siteUrl}${editorOgImage}`;

  useSeo({
    title: 'Edit Your Resume Online | ModernCV Editor',
    description: 'Open the ModernCV resume editor to customize your content, apply templates, and export as PDF.',
    canonical: '/editor',
    robots: SEO_ROBOTS_NOINDEX,
    ogImage: editorOgImage,
    imageAlt: 'ModernCV resume editor preview',
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
        },
        {
          '@type': 'WebPage',
          '@id': `${pageUrl}#webpage`,
          name: 'ModernCV Resume Editor',
          description: 'Interactive resume editor for building and exporting resumes.',
          url: pageUrl,
          inLanguage: 'en',
          isPartOf: { '@id': websiteId },
          primaryImageOfPage: {
            '@type': 'ImageObject',
            url: editorOgImageUrl,
          },
        },
      ],
    },
  });

  return (
    <div className="h-screen flex flex-col md:flex-row bg-slate-100 dark:bg-slate-950 font-sans print:bg-white overflow-hidden transition-colors duration-300">
      <aside className={`
        fixed inset-0 z-20 md:static md:w-[450px] lg:w-[500px] flex-shrink-0 bg-slate-100 dark:bg-slate-900 flex flex-col h-full border-r border-slate-200 dark:border-slate-800
        transition-all duration-300 ease-in-out
        ${isPreviewModeMobile ? 'translate-y-full md:translate-y-0' : 'translate-y-0'}
        print:hidden
      `}>
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <header className="flex-shrink-0 flex justify-between items-center p-4 bg-slate-100 dark:bg-slate-900 z-10 transition-colors">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate('/')}
                variant="icon"
                className="-ml-2"
                title="Back to Preview"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                Edit Resume
              </h1>
            </div>

            <div className="flex gap-2 items-center">
              <ThemeToggle />
              <Button
                onClick={handleExportJson}
                variant="icon"
                title="Save Data (JSON)"
              >
                <SaveIcon className="w-5 h-5" />
              </Button>
              <div className="md:hidden">
                <Button
                  onClick={() => setIsPreviewModeMobile(true)}
                  variant="primary"
                  size="sm"
                >
                  Preview
                </Button>
              </div>
              <Button
                onClick={() => navigate('/')}
                variant="success"
                size="sm"
                className="hidden md:flex"
                leftIcon={<CheckIcon className="w-4 h-4" />}
              >
                Done
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
            <SectionErrorBoundary sectionName="Resume Editor">
              <ResumeEditor data={resumeData} onChange={setResumeData} />
            </SectionErrorBoundary>
          </div>

          <div className="flex-shrink-0 p-4 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-10 flex flex-col gap-2 transition-colors">
            <Button
              onClick={handleDownloadPdf}
              variant="dark"
              className="w-full"
              leftIcon={<DownloadIcon className="w-4 h-4" />}
              isLoading={isExportingPdf}
            >
              Download PDF
            </Button>
            <div className="flex justify-center">
              <Button onClick={resetData} variant="danger-ghost" size="sm">
                Reset All Data
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <main className={`
        flex-1 h-full bg-slate-200/50 dark:bg-slate-950 print:bg-white overflow-y-auto custom-scrollbar relative
        transition-all duration-300
        ${isPreviewModeMobile ? 'z-30 inset-0 fixed' : ''}
      `}>
        {isPreviewModeMobile && (
          <div className="fixed top-4 right-4 z-50 md:hidden">
            <Button onClick={() => setIsPreviewModeMobile(false)} variant="secondary" size="sm">Close Preview</Button>
          </div>
        )}

        <div className="min-h-full p-4 md:p-8 lg:p-12 print:p-0 flex justify-center items-start">
          <div className="w-full max-w-[210mm] shadow-2xl print:shadow-none bg-white origin-top transition-transform duration-200">
            <SectionErrorBoundary sectionName="Resume Preview">
              <ResumePreview data={resumeData} />
            </SectionErrorBoundary>
          </div>
        </div>

        <div className="fixed bottom-8 right-8 print:hidden flex gap-4">
          <Button
            onClick={handleDownloadPdf}
            variant="primary"
            className="rounded-full shadow-xl p-4 h-auto"
            title="Download PDF"
            isLoading={isExportingPdf}
          >
            <DownloadIcon className="w-5 h-5" />
          </Button>
        </div>

        <div className={`md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30 transition-transform ${isPreviewModeMobile ? 'translate-y-0' : 'translate-y-20'}`}>
          <Button
            onClick={() => setIsPreviewModeMobile(false)}
            className="bg-slate-800 text-white px-6 py-3 rounded-full shadow-xl h-auto"
          >
            Continue Editing
          </Button>
        </div>
      </main>
    </div>
  );
};

export default EditorView;
