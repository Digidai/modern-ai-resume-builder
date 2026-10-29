import React, { useEffect, useRef, useState } from 'react';
import type { ResumeData } from '../types';
import { MAX_LATEX_SOURCE_CHARS } from '../shared/aiContract';
import { getTemplateById } from '../constants/templates';
import { AiError, parseLatexResume } from '../services/aiService';
import { latexParseProgress, latexSourceProblem, prepareLatexSource, resumeFromParsedLatex, type LatexProgressSection } from '../utils/latexImport';
import { Button } from './Button';
import { Textarea } from './Input';
import { ScaledResumePreview } from './ScaledResumePreview';
import { TaskProgress } from './TaskProgress';
import { XIcon } from './Icons';

const PROBLEMS = {
  empty: 'Paste your .tex source or choose a file first.',
  'not-latex': "This doesn't look like LaTeX. Paste the .tex source, not the PDF text.",
  'too-long': `That's longer than ${MAX_LATEX_SOURCE_CHARS.toLocaleString('en')} characters after comments are removed. Leave out unused sections or long macro files.`,
} as const;

const count = (n: number, one: string, many = `${one}s`) => (n ? `${n} ${n === 1 ? one : many}` : '');

/** "3 jobs · 2 degrees · 12 publications" for the preview. */
const describe = (data: ResumeData) =>
  [
    count(data.experience.length, 'job'),
    count(data.education.length, 'degree'),
    count(data.projects.length, 'project'),
    count((data.publications ?? []).length, 'publication'),
    count((data.awards ?? []).length, 'grant or award', 'grants and awards'),
    count((data.talks ?? []).length, 'talk'),
    count((data.teaching ?? []).length, 'course'),
    count(data.skills.length, 'skill line'),
  ]
    .filter(Boolean)
    .join(' · ');

const SECTION_NAMES: Record<LatexProgressSection, [string, string, string?]> = {
  experience: ['experience', 'job'],
  education: ['education', 'degree'],
  projects: ['projects', 'project'],
  publications: ['publications', 'publication'],
  awards: ['grants and awards', 'grant or award', 'grants and awards'],
  talks: ['talks', 'talk'],
  teaching: ['teaching', 'course'],
  skills: ['skills', 'skill line'],
};

interface Progress {
  stage: 'sending' | 'reading' | 'writing';
  /** Characters of JSON written so far. */
  written: number;
  section: LatexProgressSection | null;
  counts: Partial<Record<LatexProgressSection, number>>;
}

const STEPS = ['Send', 'Read', 'Write'] as const;

/** Stage and the entries found so far while the AI converts the CV. */
const ConversionProgress: React.FC<{ progress: Progress; expected: number }> = ({ progress, expected }) => {
  const step = progress.stage === 'sending' ? 0 : progress.stage === 'reading' ? 1 : 2;
  const found = (Object.keys(SECTION_NAMES) as LatexProgressSection[])
    .map((section) => count(progress.counts[section] ?? 0, SECTION_NAMES[section][1], SECTION_NAMES[section][2]))
    .filter(Boolean)
    .join(' · ');
  const status =
    progress.stage === 'sending'
      ? 'Sending your CV…'
      : progress.stage === 'reading'
        ? 'AI is reading the LaTeX…'
        : progress.section
          ? `Writing ${SECTION_NAMES[progress.section][0]}…`
          : 'Writing your resume…';
  return (
    <TaskProgress
      data-testid="latex-import-progress"
      steps={STEPS}
      step={step}
      status={status}
      label="Conversion progress"
      // Hold at 95% until the reply is complete.
      percent={step < 2 ? null : Math.min(95, Math.max(4, Math.round((progress.written / expected) * 100)))}
      note={found ? `Found so far: ${found}` : progress.stage === 'reading' ? 'Long CVs can take a minute or two; the AI reads the whole file before writing.' : '\u00a0'}
    />
  );
};

/**
 * Import LaTeX: the .tex goes to the AI parser, and the result is shown as pages before it replaces
 * the resume (the editor's undo toast can bring the old one back).
 */
export const LatexImportDialog: React.FC<{
  open: boolean;
  current: ResumeData;
  onClose: () => void;
  onImport: (data: ResumeData) => void;
}> = ({ open, current, onClose, onImport }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ResumeData | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [expected, setExpected] = useState(1);


  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      // Each import starts at the input step; the pasted source stays until a resume is imported.
      setResult(null);
      setError('');
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const convert = async () => {
    const prepared = prepareLatexSource(source);
    const problem = latexSourceProblem(prepared);
    if (problem) {
      setError(PROBLEMS[problem]);
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    // The JSON reply comes out at roughly 60% of the trimmed LaTeX.
    setExpected(prepared.length * 0.6);
    setProgress({ stage: 'sending', written: 0, section: null, counts: {} });
    let written = '';
    let lastUpdate = 0;
    // The upload takes a moment; after that the model is reading the prompt, even before it says so.
    const reading = window.setTimeout(() => setProgress((previous) => (previous?.stage === 'sending' ? { ...previous, stage: 'reading' } : previous)), 1500);
    try {
      const reply = await parseLatexResume(prepared, (event) => {
        if (event.type === 'thinking') setProgress((previous) => (previous?.stage === 'sending' ? { ...previous, stage: 'reading' } : previous));
        if (event.type !== 'delta') return;
        written += event.text;
        // Re-reading the partial JSON on every token is wasteful; a few times a second is enough.
        const now = Date.now();
        if (now - lastUpdate < 250) return;
        lastUpdate = now;
        setProgress({ stage: 'writing', written: written.length, ...latexParseProgress(written) });
      });
      const parsed = resumeFromParsedLatex(reply, current);
      if (!parsed) {
        setError("Couldn't find resume content in that LaTeX. Check it is the main .tex file and try again.");
        return;
      }
      // Academic sections only show in academic templates; switch to Scholar rather than hide them.
      const academic = (parsed.publications ?? []).length + (parsed.awards ?? []).length + (parsed.talks ?? []).length + (parsed.teaching ?? []).length > 0;
      setResult(academic && !getTemplateById(current.templateId)?.publications ? { ...parsed, templateId: 'scholar' } : parsed);
    } catch (err) {
      setError(err instanceof AiError ? err.message : 'Conversion failed. Please try again.');
    } finally {
      window.clearTimeout(reading);
      setLoading(false);
      setProgress(null);
    }
  };

  const close = () => {
    if (!loading) onClose();
  };

  const switchedTemplate = result && result.templateId !== current.templateId ? getTemplateById(result.templateId)?.name : null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={(event) => {
        if (loading) event.preventDefault();
      }}
      aria-labelledby="latex-import-title"
      className="m-auto w-[min(56rem,calc(100vw-2rem))] max-h-[calc(100vh-2rem)] overflow-hidden rounded-xl border border-rule bg-surface p-0 text-ink shadow-raised backdrop:bg-black/40"
    >
      <div className="flex max-h-[calc(100vh-2rem)] flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-rule px-5 py-4">
          <div>
            <h2 id="latex-import-title" className="text-base font-semibold">
              Import a LaTeX resume
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              From Overleaf or a .tex file (moderncv, Awesome-CV, Jake&apos;s Resume and others). AI reads it; you check the result before anything changes.
            </p>
          </div>
          <Button variant="icon" onClick={close} aria-label="Close" disabled={loading}>
            <XIcon className="h-4 w-4" />
          </Button>
        </div>

        {!result ? (
          <div className="space-y-3 overflow-y-auto px-5 py-4">
            <Textarea
              label="LaTeX source"
              value={source}
              onChange={setSource}
              minRows={12}
              disabled={loading}
              placeholder={'\\documentclass{moderncv}\n\\name{Pat}{Lee}\n\\begin{document}\n\\section{Experience}\n\\cventry{2021--2026}{PhD researcher}{CMU}{}{}{...}'}
              hint="Paste the main .tex file. If your CV is split across several files, paste them one after another."
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => void convert()} isLoading={loading} disabled={!source.trim()}>
                {loading ? 'Converting…' : 'Convert'}
              </Button>
              <Button variant="ghost" onClick={() => fileRef.current?.click()} disabled={loading}>
                Choose .tex file
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".tex,.ltx,.txt,text/plain,application/x-tex"
                className="hidden"
                aria-label="Choose a .tex file"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (!file) return;
                  if (file.size > 1_000_000) {
                    setError('That file is larger than 1 MB.');
                    return;
                  }
                  setSource(await file.text());
                  setError('');
                }}
              />
            </div>
            {loading && progress && <ConversionProgress progress={progress} expected={expected} />}
            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 gap-5 overflow-hidden px-5 py-4 md:grid-cols-[minmax(0,1fr)_17rem]">
            <div className="custom-scrollbar min-h-0 overflow-y-auto rounded-lg bg-tint p-4" data-testid="latex-import-preview">
              <ScaledResumePreview data={result} mode="page" view="pages" />
            </div>
            <div className="flex flex-col gap-3 text-sm">
              <p className="font-medium">{result.fullName || 'Unnamed resume'}</p>
              <p className="text-muted">{describe(result) || 'No sections found.'}</p>
              {switchedTemplate && <p className="text-muted">Shown in {switchedTemplate} so the academic sections appear. You can change the template afterwards.</p>}
              <p className="rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                Check every entry: AI can misread custom macros. Importing replaces your current resume; Undo brings it back.
              </p>
              <div className="mt-auto flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    setSource('');
                    onImport(result);
                  }}
                >
                  Replace my resume
                </Button>
                <Button variant="secondary" onClick={() => setResult(null)}>
                  Back
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
};
