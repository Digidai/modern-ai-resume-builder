import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
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
  CodeIcon,
} from '../components/Icons';
import { Button } from '../components/Button';
import ThemeToggle from '../components/ThemeToggle';
import { useResume } from '../contexts/ResumeContext';
import { SectionErrorBoundary } from '../components/ErrorBoundary';
import { buildEditorSeoKeywords } from '../utils/seo';
import { getTemplateById } from '../constants/templates';
import type { ResumeSaveStatus } from '../hooks/useResumeData';
import { pageLimitNote, useOnePageFit } from '../hooks/useOnePageFit';
import { DEFAULT_DESIGN, type ResumeDesign } from '../types';
import { paperSize } from '../constants/print';
import { useToast } from '../components/Toast';
import { decodeResumePayload, readResumeHash } from '../shared/resumeLink';
import { sanitizeResumeData } from '../utils/resumeData';
import { downloadLatex, openInOverleaf } from '../utils/latex';
import { LatexImportDialog } from '../components/LatexImportDialog';
import { TaskProgress } from '../components/TaskProgress';
import type { PdfExportProgress } from '../utils/pdfExport';

const PDF_STEPS = ['Prepare', 'Render', 'Save'] as const;

/** Card under Download PDF while an export runs: what it is doing now and for how long. */
const PdfProgress: React.FC<{ progress: PdfExportProgress }> = ({ progress }) => {
  const { stage } = progress;
  const status =
    stage === 'preparing'
      ? 'Loading fonts and the template…'
      : stage === 'server'
        ? 'Rendering a vector PDF…'
        : stage === 'browser'
          ? 'Rendering in your browser…'
          : stage === 'building'
            ? `Building page ${progress.page} of ${progress.pages}…`
            : 'Saving the file…';
  const browser = stage === 'browser' || stage === 'building';
  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg bg-surface shadow-raised">
      <TaskProgress
        data-testid="pdf-progress"
        steps={PDF_STEPS}
        step={stage === 'preparing' ? 0 : stage === 'saving' ? 2 : 1}
        status={status}
        label="PDF export progress"
        percent={stage === 'building' ? Math.round((progress.page / progress.pages) * 100) : stage === 'saving' ? 100 : null}
        note={browser ? "The server is unavailable, so this copy is an image PDF: its text can't be selected." : 'Usually takes a few seconds.'}
      />
    </div>
  );
};

const SaveIndicator: React.FC<{ status: ResumeSaveStatus }> = ({ status }) => {
  const content =
    status === 'saving'
      ? { icon: <LoaderIcon className="h-3.5 w-3.5 animate-spin" />, text: 'Saving…', tone: 'text-muted' }
      : status === 'error'
        ? { icon: <AlertIcon className="h-3.5 w-3.5" />, text: 'Not saved', tone: 'text-danger' }
        : { icon: <CloudCheckIcon className="h-3.5 w-3.5" />, text: 'Saved in this browser', tone: 'text-muted' };
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
          className="animate-enter absolute right-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-lg border border-rule bg-surface p-1 shadow-sheet"
        >
          {items.map((group, groupIndex) => (
            <div key={groupIndex} className={groupIndex > 0 ? 'mt-1 border-t border-rule pt-1' : ''}>
              {group.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    item.onSelect();
                  }}
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-tint focus-visible:bg-tint focus-visible:outline-none"
                >
                  <span className="mt-0.5 text-muted">{item.icon}</span>
                  <span>
                    <span className="block text-sm font-medium text-ink">{item.label}</span>
                    {item.description && <span className="block text-xs text-muted">{item.description}</span>}
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

type PreviewView = 'pages' | 'continuous';
const PREVIEW_VIEW_KEY = 'moderncv:previewView';
const readPreviewView = (): PreviewView => {
  try {
    return localStorage.getItem(PREVIEW_VIEW_KEY) === 'continuous' ? 'continuous' : 'pages';
  } catch {
    return 'pages';
  }
};

/** Pages (as printed, the default) or one continuous sheet. */
const PreviewViewToggle: React.FC<{ view: PreviewView; onChange: (view: PreviewView) => void }> = ({ view, onChange }) => (
  <div className="mx-auto mb-3 flex w-full max-w-[216mm] justify-end print:hidden max-md:hidden">
    <div role="group" aria-label="Preview layout" className="inline-flex rounded-lg border border-rule bg-surface p-0.5 text-xs shadow-card">
      {(
        [
          ['pages', 'Pages'],
          ['continuous', 'Continuous'],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={view === value}
          onClick={() => onChange(value)}
          className={`rounded-md px-2.5 py-1 font-medium transition-colors focus-ring ${view === value ? 'bg-ink text-paper' : 'text-muted hover:text-ink'}`}
        >
          {label}
        </button>
      ))}
    </div>
  </div>
);

/** Under the preview: how many pages the PDF will have, with a one-click fit when it runs over. */
const PageStatus: React.FC<{ design: ResumeDesign; onChange: (patch: Partial<ResumeDesign>) => void; view: PreviewView; maxPages?: number }> = ({
  design,
  onChange,
  view,
  maxPages,
}) => {
  const { pageCount, lastPageSparse, fitLabel, fit, note, atMinimum, overLimit } = useOnePageFit(design, onChange, maxPages);
  if (pageCount === null) return null;
  return (
    <div className="mt-4 flex flex-col items-center gap-2 text-center text-xs text-muted print:hidden" aria-live="polite">
      {pageCount === 1 ? (
        <p>Fits on one page.</p>
      ) : (
        <>
          <p>
            <span className="font-medium text-ink">{pageCount} pages.</span>
            {lastPageSparse && <> Page {pageCount} has only a few lines.</>}
            {view === 'continuous' && <> Dashed lines show where each new page starts; they aren't printed.</>}
          </p>
          {!atMinimum && (
            <Button variant="secondary" size="sm" onClick={fit}>
              {fitLabel}
            </Button>
          )}
        </>
      )}
      {overLimit && maxPages && pageCount !== null && (
        <p role="status" className="max-w-md leading-relaxed text-amber-800 dark:text-amber-300">
          {pageLimitNote(pageCount, maxPages)}
        </p>
      )}
      {note && <p className="max-w-md leading-relaxed text-amber-800 dark:text-amber-300">{note}</p>}
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
    loadResume,
    isExportingPdf,
    pdfProgress,
    saveError,
    saveStatus,
  } = useResume();
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');
  const [latexImportOpen, setLatexImportOpen] = useState(false);
  const [previewView, setPreviewView] = useState<PreviewView>(readPreviewView);
  const changePreviewView = useCallback((view: PreviewView) => {
    setPreviewView(view);
    try {
      localStorage.setItem(PREVIEW_VIEW_KEY, view);
    } catch {
      // Storage may be unavailable (private mode); the choice then lasts for this visit.
    }
  }, []);
  const updateDesign = useCallback(
    (patch: Partial<ResumeDesign>) => setResumeData((prev) => ({ ...prev, design: { ...(prev.design ?? DEFAULT_DESIGN), ...patch } })),
    [setResumeData]
  );
  const isBlankResume =
    !resumeData.fullName.trim() &&
    !resumeData.summary.trim() &&
    resumeData.experience.every((e) => !e.role.trim() && !e.company.trim() && !e.description.trim());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Deep link: /editor/?template=<id> (used by the template pages, llms.txt and agents).
  useEffect(() => {
    const requested = searchParams.get('template');
    if (!requested) return;
    if (getTemplateById(requested)) setResumeData((prev) => ({ ...prev, templateId: requested }));
    const next = new URLSearchParams(searchParams);
    next.delete('template');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, setResumeData]);

  // Agent handoff: /editor/#resume=<payload> opens the editor with that resume (see src/shared/resumeLink.ts).
  // The fragment never reaches the server; it is removed once read so a reload doesn't load it again.
  // `hashchange` covers a second link opened while the editor is already showing.
  const { showError, showToast } = useToast();
  const currentTemplateRef = useRef(resumeData.templateId);
  currentTemplateRef.current = resumeData.templateId;
  useEffect(() => {
    const loadFromHash = () => {
      const payload = readResumeHash(window.location.hash);
      if (!payload) return;
      window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
      void decodeResumePayload(payload).then((raw) => {
        const parsed = sanitizeResumeData(raw);
        if (!parsed) {
          showError("This link doesn't contain a valid resume.");
          return;
        }
        // Keep the user's current template unless the link names a valid one.
        const named = raw && typeof raw === 'object' && typeof (raw as { templateId?: unknown }).templateId === 'string';
        if (!named || !getTemplateById(parsed.templateId)) parsed.templateId = currentTemplateRef.current;
        loadResume(parsed, `Loaded ${parsed.fullName ? `${parsed.fullName}'s resume` : 'the resume'} from the link.`);
      });
    };
    loadFromHash();
    window.addEventListener('hashchange', loadFromHash);
    return () => window.removeEventListener('hashchange', loadFromHash);
  }, [loadResume, showError]);

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
      {
        label: 'Import LaTeX (.tex)',
        description: 'Convert a LaTeX resume or CV from Overleaf; preview it first.',
        icon: <CodeIcon className="h-4 w-4" />,
        onSelect: () => setLatexImportOpen(true),
      },
    ],
    [
      {
        label: 'Open in Overleaf',
        description: 'Continue in LaTeX: a new Overleaf project with this resume.',
        icon: <CodeIcon className="h-4 w-4" />,
        onSelect: () => {
          openInOverleaf(resumeData);
          // The rest happens in Overleaf's tab: it creates the project, then compiles the PDF.
          showToast('Opening Overleaf in a new tab. It creates the project, then compiles the PDF there.', 'info', { duration: 8000 });
        },
      },
      {
        label: 'Download LaTeX (.tex)',
        description: 'A standalone .tex file for pdfLaTeX or XeLaTeX.',
        icon: <FileIcon className="h-4 w-4" />,
        onSelect: () => downloadLatex(resumeData),
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
      className={`rounded-lg border px-3 py-1 text-sm font-medium transition-colors focus-ring ${
        mobileView === view
          ? 'border-rule bg-surface text-ink'
          : 'border-transparent text-muted'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-paper font-sans text-ink print:h-auto print:bg-white">
      <header className="z-30 flex h-14 shrink-0 items-center gap-2 border-b border-rule bg-paper px-2 sm:px-4 print:hidden">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-ink hover:bg-tint focus-ring"
          aria-label="Back to home"
        >
          <ArrowLeftIcon className="h-4 w-4 text-muted" />
          <span className="hidden sm:inline">ModernCV</span>
        </Link>
        <span className="hidden h-5 w-px bg-tint sm:block" />
        <SaveIndicator status={saveStatus} />

        <div className="flex flex-1 justify-center md:hidden">
          <div className="flex rounded-lg bg-paper p-0.5" role="group" aria-label="View">
            {segment('edit', 'Edit')}
            {segment('preview', 'Preview')}
          </div>
        </div>
        <div className="hidden flex-1 md:block" />

        <div className="hidden sm:block">
          <ThemeToggle />
        </div>
        <ActionsMenu items={menuItems} />
        <LatexImportDialog
          open={latexImportOpen}
          current={resumeData}
          onClose={() => setLatexImportOpen(false)}
          onImport={(data) => {
            setLatexImportOpen(false);
            loadResume(data, 'Imported your LaTeX resume.');
          }}
        />
        <div className="relative">
          <Button
            onClick={handleDownloadPdf}
            isLoading={isExportingPdf}
            leftIcon={<DownloadIcon className="h-4 w-4" />}
            className="max-sm:h-9 max-sm:w-9 max-sm:px-0"
            aria-label="Download PDF"
          >
            <span className="max-sm:sr-only">{isExportingPdf ? 'Exporting…' : 'Download PDF'}</span>
          </Button>
          {pdfProgress && <PdfProgress progress={pdfProgress} />}
        </div>
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
          className={`custom-scrollbar w-full shrink-0 overflow-y-auto bg-paper md:w-[460px] md:border-r md:border-rule lg:w-[520px] md: print:hidden ${
            mobileView === 'preview' ? 'max-md:hidden' : ''
          }`}
        >
          {saveError && (
            <div role="alert" className="m-4 mb-0 flex gap-2 rounded-lg border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">
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
          className={`custom-scrollbar flex-1 overflow-y-auto bg-tint px-3 py-4 sm:p-8 lg:p-10 print:overflow-visible print:bg-white print:p-0 ${
            mobileView === 'edit' ? 'max-md:pointer-events-none max-md:invisible max-md:absolute max-md:inset-x-0 max-md:h-0 max-md:overflow-hidden' : ''
          }`}
          aria-label="Resume preview"
        >
          <PreviewViewToggle view={previewView} onChange={changePreviewView} />
          <div
            className={`relative mx-auto w-full print:max-w-none! print:shadow-none ${previewView === 'pages' ? '' : 'bg-white shadow-sheet'}`}
            style={{ maxWidth: `${paperSize(resumeData.design?.paper).widthMm}mm` }}
          >
            <SectionErrorBoundary sectionName="Resume Preview">
              <ScaledResumePreview data={resumeData} mode="page" exportable view={previewView} />
            </SectionErrorBoundary>
            {isBlankResume && (
              // Sits over the empty page, outside the exported element, so it never reaches the PDF.
              <p className="pointer-events-none absolute inset-x-0 top-[18%] px-8 text-center font-display text-lg text-[#6E695F] print:hidden" aria-hidden="true">
                Your resume will appear here. Start with your name on the left.
              </p>
            )}
          </div>
          <PageStatus design={resumeData.design ?? DEFAULT_DESIGN} onChange={updateDesign} view={previewView} maxPages={getTemplateById(resumeData.templateId)?.maxPages} />
        </main>
      </div>
    </div>
  );
};

export default EditorView;
