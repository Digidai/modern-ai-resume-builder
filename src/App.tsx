import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useResumeData } from './hooks/useResumeData';
import { useSeo, SEO_ROBOTS_INDEX, SEO_ROBOTS_NOINDEX, getSiteUrl } from './hooks/useSeo';
import ResumePreview from './components/ResumePreview';
import ResumeEditor from './components/ResumeEditor';
import JobTitles from './components/JobTitles';
import TemplateSelector from './components/TemplateSelector';
import { DownloadIcon, EditIcon, CheckIcon, ArrowLeftIcon, SaveIcon, BriefcaseIcon } from './components/Icons';
import { Button } from './components/Button';
import ThemeToggle from './components/ThemeToggle';
import { ResumeData } from './types';
import { slugifyJobTitle } from './utils/slug';
import { exportResumeToPdf } from './utils/pdfExport';

// ============================================================================
// Sub-View Components (Defined here to avoid creating multiple files for now)
// ============================================================================

interface HomeViewProps {
  resumeData: ResumeData;
  onDownloadPdf: () => void;
  isExportingPdf: boolean;
}

const HomeView: React.FC<HomeViewProps> = ({ resumeData, onDownloadPdf, isExportingPdf }) => {
  const navigate = useNavigate();

  const siteUrl = getSiteUrl();
  const orgId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;

  useSeo({
    title: 'ModernCV - Free AI Resume Builder | Create Professional Resumes Online',
    description:
      "Create stunning professional resumes in minutes with ModernCV's free AI-powered resume builder. Choose templates, get AI suggestions, and download as PDF instantly.",
    canonical: '/',
    robots: SEO_ROBOTS_INDEX,
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
            target: `${siteUrl}/directory?q={search_term_string}`,
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
          screenshot: `${siteUrl}/og-image.png`,
          publisher: { '@id': orgId },
          isPartOf: { '@id': websiteId },
        },
      ],
    },
  });

  return (
    <div className="min-h-screen bg-slate-200 dark:bg-slate-950 font-sans print:bg-white flex flex-col transition-colors duration-300">
      {/* Header */}
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
              onClick={onDownloadPdf}
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
        <div className="max-w-[21cm] mx-auto shadow-2xl print:shadow-none transition-transform duration-500 ease-out animate-in fade-in slide-in-from-bottom-4">
          <ResumePreview data={resumeData} />
        </div>
        <div className="h-24 print:hidden"></div> {/* Spacer for mobile fab */}
      </main>

      {/* Mobile Floating Action Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 md:hidden print:hidden flex gap-3">
        <Button
          onClick={() => navigate('/directory')}
          variant="secondary"
          className="rounded-full shadow-xl"
          title="Job Directory"
        >
          <BriefcaseIcon className="w-5 h-5" />
        </Button>
        <Button
          onClick={onDownloadPdf}
          variant="secondary"
          className="rounded-full shadow-xl"
          title="Download PDF"
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

interface EditorViewProps {
  resumeData: ResumeData;
  setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>;
  resetData: () => void;
  onDownloadPdf: () => void;
  onExportJson: () => void;
  isExportingPdf: boolean;
}

const EditorView: React.FC<EditorViewProps> = ({ resumeData, setResumeData, resetData, onDownloadPdf, onExportJson, isExportingPdf }) => {
  const navigate = useNavigate();
  const [isPreviewModeMobile, setIsPreviewModeMobile] = useState(false);

  const siteUrl = getSiteUrl();
  const orgId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;
  const pageUrl = `${siteUrl}/editor`;

  useSeo({
    title: 'Edit Your Resume Online | ModernCV Editor',
    description: 'Open the ModernCV resume editor to customize your content, apply templates, and export as PDF.',
    canonical: '/editor',
    robots: SEO_ROBOTS_NOINDEX,
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
        },
      ],
    },
  });


  return (
    <div className="h-screen flex flex-col md:flex-row bg-slate-100 dark:bg-slate-950 font-sans print:bg-white overflow-hidden transition-colors duration-300">
      {/* Sidebar / Editor */}
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
                onClick={onExportJson}
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

          {/* Editor Content - independent scroll */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
            <ResumeEditor data={resumeData} onChange={setResumeData} />
          </div>

          {/* Footer Actions */}
          <div className="flex-shrink-0 p-4 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-10 flex flex-col gap-2 transition-colors">
            <Button
              onClick={onDownloadPdf}
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

      {/* Preview Area */}
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
            <ResumePreview data={resumeData} />
          </div>
        </div>

        {/* Floating Actions for Desktop */}
        <div className="fixed bottom-8 right-8 print:hidden flex gap-4">
          <Button
            onClick={onDownloadPdf}
            variant="primary"
            className="rounded-full shadow-xl p-4 h-auto"
            title="Download PDF"
            isLoading={isExportingPdf}
          >
            <DownloadIcon className="w-5 h-5" />
          </Button>
        </div>

        {/* Mobile Preview Toggle */}
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


// ============================================================================
// Main App Component
// ============================================================================

function App() {
  const { resumeData, setResumeData, resetData } = useResumeData();
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const navigate = useNavigate();

  const handleDownloadPdf = async () => {
    if (isExportingPdf) return;
    const preview = document.getElementById('resume-preview-container');
    if (!preview) {
      alert('Resume preview is not ready yet.');
      return;
    }

    setIsExportingPdf(true);
    try {
      const fileBase = resumeData.fullName.trim() || 'resume';
      await exportResumeToPdf(preview, fileBase, resumeData);
    } catch (error) {
      console.error(error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Allow users to save their data to a JSON file
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(resumeData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${(resumeData.fullName || 'resume').replace(/\s+/g, '_').toLowerCase()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleUseTemplate = (jobTitle: string, templateId: string) => {
    setResumeData(prev => ({
      ...prev,
      title: jobTitle,
      templateId: templateId
    }));
    navigate('/editor');
  };

  const handleJobSelect = (title: string) => {
    navigate(`/resume_tmpl/${slugifyJobTitle(title)}`);
  };

  return (
    <Routes>
      <Route path="/" element={<HomeView resumeData={resumeData} onDownloadPdf={handleDownloadPdf} isExportingPdf={isExportingPdf} />} />
      <Route path="/directory" element={<JobTitles onBack={() => navigate('/')} onSelect={handleJobSelect} />} />
      <Route path="/resume_tmpl/:jobTitle" element={<TemplateSelector onUseTemplate={handleUseTemplate} />} />
      <Route
        path="/editor"
        element={
          <EditorView
            resumeData={resumeData}
            setResumeData={setResumeData}
            resetData={resetData}
            onDownloadPdf={handleDownloadPdf}
            onExportJson={handleExportJson}
            isExportingPdf={isExportingPdf}
          />
        }
      />
    </Routes>
  );
}

export default App;
