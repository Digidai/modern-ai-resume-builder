import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useSeo, SEO_ROBOTS_NOINDEX, getSiteUrl } from '../hooks/useSeo';
import ResumeEditor from '../components/ResumeEditor';
import { ScaledResumePreview } from '../components/ScaledResumePreview';
import {
  DownloadIcon,
  ArrowLeftIcon,
  MoreIcon,
  UploadIcon,
  SaveIcon,
  FileIcon,
  RotateIcon,
  CloudCheckIcon,
  AlertIcon,
  LoaderIcon,
} from '../components/Icons';
import { Button } from '../components/Button';
import ThemeToggle from '../components/ThemeToggle';
import { useResume } from '../contexts/ResumeContext';
import { SectionErrorBoundary } from '../components/ErrorBoundary';
import { buildEditorSeoKeywords } from '../utils/seo';
import type { ResumeSaveStatus } from '../hooks/useResumeData';

const SaveIndicator: React.FC<{ status: ResumeSaveStatus }> = ({ status }) => {
  const content =
    status === 'saving'
      ? { icon: <LoaderIcon className="h-3.5 w-3.5 animate-spin" />, text: 'Saving…', tone: 'text-slate-500 dark:text-slate-400' }
      : status === 'error'
        ? { icon: <AlertIcon className="h-3.5 w-3.5" />, text: 'Not saved', tone: 'text-red-600 dark:text-red-400' }
        : { icon: <CloudCheckIcon className="h-3.5 w-3.5" />, text: 'Saved in this browser', tone: 'text-slate-500 dark:text-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${content.tone}`} role="status" aria-live="polite" title={content.text}>
      {content.icon}
      <span className="hidden lg:inline">{content.text}</span>
    </span>
  );
};

interface MenuItem {
  label: string;
  description?: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

/** Overflow menu for backup / reset actions. */
const ActionsMenu: React.FC<{ items: MenuItem[][] }> = ({ items }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <Button variant="icon" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} aria-label="More actions" title="More actions">
        <MoreIcon className="h-5 w-5" />
      </Button>
      {open && (
        <div
          role="menu"
          className="animate-enter absolute right-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-800 dark:bg-slate-900"
        >
          {items.map((group, groupIndex) => (
            <div key={groupIndex} className={groupIndex > 0 ? 'mt-1 border-t border-slate-100 pt-1 dark:border-slate-800' : ''}>
              {group.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    item.onSelect();
                  }}
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none dark:hover:bg-slate-800 dark:focus-visible:bg-slate-800"
                >
                  <span className="mt-0.5 text-slate-500 dark:text-slate-400">{item.icon}</span>
                  <span>
                    <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">{item.label}</span>
                    {item.description && <span className="block text-xs text-slate-500 dark:text-slate-400">{item.description}</span>}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const EditorView: React.FC = () => {
  const {
    resumeData,
    setResumeData,
    handleDownloadPdf,
    handleExportJson,
    importJson,
    startOver,
    isExportingPdf,
    saveError,
    saveStatus,
  } = useResume();
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const siteUrl = getSiteUrl();
  const websiteId = `${siteUrl}/#website`;
  const pageUrl = `${siteUrl}/editor/`;
  const editorOgImage = '/og/editor.png';

  useSeo({
    title: 'Edit Your Resume Online | ModernCV Editor',
    description: 'Open the ModernCV resume editor to customize your content, apply templates, and export as PDF.',
    keywords: buildEditorSeoKeywords(),
    canonical: '/editor/',
    robots: SEO_ROBOTS_NOINDEX,
    ogImage: editorOgImage,
    imageAlt: 'ModernCV resume editor preview',
    ldJson: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${siteUrl}/#organization`,
          name: 'ModernCV',
          url: `${siteUrl}/`,
          logo: { '@type': 'ImageObject', url: `${siteUrl}/apple-touch-icon.png` },
        },
        { '@type': 'WebSite', '@id': websiteId, name: 'ModernCV', url: `${siteUrl}/`, inLanguage: 'en' },
        {
          '@type': 'WebPage',
          '@id': `${pageUrl}#webpage`,
          name: 'ModernCV Resume Editor',
          description: 'Interactive resume editor for building and exporting resumes.',
          url: pageUrl,
          inLanguage: 'en',
          isPartOf: { '@id': websiteId },
          primaryImageOfPage: { '@type': 'ImageObject', url: `${siteUrl}${editorOgImage}` },
        },
      ],
    },
  });

  const menuItems: MenuItem[][] = [
    [
      {
        label: 'Save backup',
        description: 'Download a .json file to edit later or on another device.',
        icon: <SaveIcon className="h-4 w-4" />,
        onSelect: handleExportJson,
      },
      {
        label: 'Import backup',
        description: 'Open a .json file saved from ModernCV.',
        icon: <UploadIcon className="h-4 w-4" />,
        onSelect: () => fileInputRef.current?.click(),
      },
    ],
    [
      { label: 'Start from blank', icon: <FileIcon className="h-4 w-4" />, onSelect: () => startOver('blank') },
      { label: 'Restore sample resume', icon: <RotateIcon className="h-4 w-4" />, onSelect: () => startOver('sample') },
    ],
  ];

  const segment = (view: 'edit' | 'preview', label: string) => (
    <button
      type="button"
      onClick={() => setMobileView(view)}
      aria-pressed={mobileView === view}
      className={`rounded-md px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
        mobileView === view
          ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
          : 'text-slate-500 dark:text-slate-400'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-100 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100 print:h-auto print:bg-white">
      <header className="z-30 flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-2 sm:px-4 dark:border-slate-800 dark:bg-slate-950 print:hidden">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-white dark:hover:bg-slate-800"
          aria-label="Back to home"
        >
          <ArrowLeftIcon className="h-4 w-4 text-slate-500" />
          <span className="hidden sm:inline">ModernCV</span>
        </Link>
        <span className="hidden h-5 w-px bg-slate-200 sm:block dark:bg-slate-800" />
        <SaveIndicator status={saveStatus} />

        <div className="flex flex-1 justify-center md:hidden">
          <div className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800" role="group" aria-label="View">
            {segment('edit', 'Edit')}
            {segment('preview', 'Preview')}
          </div>
        </div>
        <div className="hidden flex-1 md:block" />

        <div className="hidden sm:block">
          <ThemeToggle />
        </div>
        <ActionsMenu items={menuItems} />
        <Button
          onClick={handleDownloadPdf}
          isLoading={isExportingPdf}
          leftIcon={<DownloadIcon className="h-4 w-4" />}
          className="max-sm:h-9 max-sm:w-9 max-sm:rounded-full max-sm:px-0"
          aria-label="Download PDF"
        >
          <span className="max-sm:sr-only">{isExportingPdf ? 'Exporting…' : 'Download PDF'}</span>
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void importJson(file);
          }}
        />
      </header>

      <div className="flex min-h-0 flex-1">
        <aside
          className={`custom-scrollbar w-full shrink-0 overflow-y-auto bg-slate-50 md:w-[460px] md:border-r md:border-slate-200 lg:w-[520px] dark:bg-slate-950 md:dark:border-slate-800 print:hidden ${
            mobileView === 'preview' ? 'max-md:hidden' : ''
          }`}
        >
          {saveError && (
            <div role="alert" className="m-4 mb-0 flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Changes can't be saved in this browser ({saveError}). Use <strong>More → Save backup</strong> to keep a copy.
              </span>
            </div>
          )}
          <SectionErrorBoundary sectionName="Resume Editor">
            <ResumeEditor data={resumeData} onChange={setResumeData} />
          </SectionErrorBoundary>
        </aside>

        {/* Kept mounted (just visually hidden) on mobile so PDF export can always read the preview. */}
        <main
          className={`custom-scrollbar flex-1 overflow-y-auto bg-slate-200/70 px-3 py-4 sm:p-8 lg:p-10 dark:bg-slate-900 print:overflow-visible print:bg-white print:p-0 ${
            mobileView === 'edit' ? 'max-md:pointer-events-none max-md:invisible max-md:absolute max-md:inset-x-0 max-md:h-0 max-md:overflow-hidden' : ''
          }`}
          aria-label="Resume preview"
        >
          <div className="mx-auto w-full max-w-[210mm] shadow-xl ring-1 ring-slate-900/5 print:max-w-none print:shadow-none print:ring-0">
            <SectionErrorBoundary sectionName="Resume Preview">
              <ScaledResumePreview data={resumeData} mode="page" exportable />
            </SectionErrorBoundary>
          </div>
          <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400 print:hidden">
            Dashed lines mark A4 page breaks. They aren't printed.
          </p>
        </main>
      </div>
    </div>
  );
};

export default EditorView;
