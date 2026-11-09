import React, { useEffect, useRef, useState } from 'react';
import type { ResumeData } from '../types';
import { MAX_LATEX_SOURCE_CHARS } from '../shared/aiContract';
import { getTemplateById } from '../constants/templates';
import { AiError, parseLatexResume, parseResumeText } from '../services/aiService';
import { latexParseProgress, latexSourceProblem, prepareLatexSource, resumeFromParsedLatex, type LatexProgressSection } from '../utils/latexImport';
import { Button } from './Button';
import { Textarea } from './Input';
import { ScaledResumePreview } from './ScaledResumePreview';
import { TaskProgress } from './TaskProgress';
import { toPortraitDataUrl } from './PhotoField';
import { UploadIcon, XIcon } from './Icons';
import { looksLikeLatex, readResumeFile, ResumeFileError, tidyResumeText, type ResumeSource } from '../utils/resumeFile';

const PROBLEMS = {
  empty: 'Choose a file or paste your resume first.',
  'not-latex': "This doesn't look like LaTeX.",
  'too-long': `That's longer than ${MAX_LATEX_SOURCE_CHARS.toLocaleString('en')} characters. Leave out unused sections or long macro files.`,
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

/**
 * Where the dialog is. Only `input` takes typing and files; `reading` and `converting` lock it,
 * and only `review` has a result. Mirrored on the dialog as `data-state` (with `error` for an
 * input step showing an error) so tests and agents can wait for a step without reading the text.
 */
type Phase =
  | { name: 'input'; error: string }
  | { name: 'reading'; file: string }
  | { name: 'converting'; latex: boolean; expected: number; progress: Progress }
  | { name: 'review'; result: ResumeData };

const INPUT: Phase = { name: 'input', error: '' };
const inputError = (error: string): Phase => ({ name: 'input', error });

/** Stage and the entries found so far while the AI converts the CV. */
const ConversionProgress: React.FC<{ progress: Progress; expected: number; latex: boolean }> = ({ progress, expected, latex }) => {
  const step = progress.stage === 'sending' ? 0 : progress.stage === 'reading' ? 1 : 2;
  const found = (Object.keys(SECTION_NAMES) as LatexProgressSection[])
    .map((section) => count(progress.counts[section] ?? 0, SECTION_NAMES[section][1], SECTION_NAMES[section][2]))
    .filter(Boolean)
    .join(' · ');
  const status =
    progress.stage === 'sending'
      ? 'Sending your CV…'
      : progress.stage === 'reading'
        ? latex
          ? 'AI is reading the LaTeX…'
          : 'AI is reading your resume…'
        : progress.section
          ? `Writing ${SECTION_NAMES[progress.section][0]}…`
          : 'Writing your resume…';
  return (
    <TaskProgress
      data-testid="resume-import-progress"
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
 * Import resume: the text of a PDF, Word file, .tex or paste goes to the AI parser, and the result is
 * shown as pages before it replaces the resume (the editor's undo toast can bring the old one back).
 */
export const ResumeImportDialog: React.FC<{
  open: boolean;
  current: ResumeData;
  onClose: () => void;
  onImport: (data: ResumeData) => void;
}> = ({ open, current, onClose, onImport }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState('');
  const [phase, setPhase] = useState<Phase>(INPUT);
  const [dragging, setDragging] = useState(false);
  /** The headshot found in the last file read, as the editor stores photos, and whether to import it. */
  const [photo, setPhoto] = useState('');
  const [keepPhoto, setKeepPhoto] = useState(true);


  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      // Each import starts at the input step; the pasted source stays until a resume is imported.
      setPhase(INPUT);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const convert = async ({ kind, text }: ResumeSource) => {
    const isLatex = kind === 'latex';
    const prepared = isLatex ? prepareLatexSource(text) : tidyResumeText(text);
    const problem = isLatex ? latexSourceProblem(prepared) : !prepared ? 'empty' : prepared.length > MAX_LATEX_SOURCE_CHARS ? 'too-long' : null;
    if (problem) {
      setPhase(inputError(PROBLEMS[problem]));
      return;
    }
    // The JSON reply comes out at roughly 60% of the trimmed LaTeX, and a bit longer than plain text.
    const expected = prepared.length * (isLatex ? 0.6 : 1.2);
    setPhase({ name: 'converting', latex: isLatex, expected, progress: { stage: 'sending', written: 0, section: null, counts: {} } });
    /** Progress only moves forward and only while converting, so a late timer or event can't undo a later step. */
    const advance = (update: (progress: Progress) => Progress | null) =>
      setPhase((previous) => {
        if (previous.name !== 'converting') return previous;
        const progress = update(previous.progress);
        return progress ? { ...previous, progress } : previous;
      });
    const startReading = () => advance((progress) => (progress.stage === 'sending' ? { ...progress, stage: 'reading' } : null));
    let written = '';
    let lastUpdate = 0;
    // The upload takes a moment; after that the model is reading the prompt, even before it says so.
    const readingTimer = window.setTimeout(startReading, 1500);
    try {
      const reply = await (isLatex ? parseLatexResume : parseResumeText)(prepared, (event) => {
        if (event.type === 'thinking') startReading();
        if (event.type !== 'delta') return;
        written += event.text;
        // Re-reading the partial JSON on every token is wasteful; a few times a second is enough.
        const now = Date.now();
        if (now - lastUpdate < 250) return;
        lastUpdate = now;
        advance(() => ({ stage: 'writing', written: written.length, ...latexParseProgress(written) }));
      });
      const parsed = resumeFromParsedLatex(reply, current);
      if (!parsed) {
        setPhase(inputError(isLatex ? "Couldn't find resume content in that LaTeX. Check it is the main .tex file and try again." : "Couldn't find resume content in that text. Check it is your resume and try again."));
        return;
      }
      // Academic sections only show in academic templates; switch to Scholar rather than hide them.
      const academic = (parsed.publications ?? []).length + (parsed.awards ?? []).length + (parsed.talks ?? []).length + (parsed.teaching ?? []).length > 0;
      setPhase({ name: 'review', result: academic && !getTemplateById(current.templateId)?.publications ? { ...parsed, templateId: 'scholar' } : parsed });
    } catch (err) {
      setPhase(inputError(err instanceof AiError ? err.message : 'Conversion failed. Please try again.'));
    } finally {
      window.clearTimeout(readingTimer);
    }
  };

  const busy = phase.name === 'reading' || phase.name === 'converting';
  const result = phase.name === 'review' ? phase.result : null;
  const error = phase.name === 'input' ? phase.error : '';

  /** Reads the file's text into the box (so it can be checked or fixed), then converts it. */
  const openFile = async (file: File | undefined) => {
    if (!file || busy) return;
    // Stays in `reading` through the photo step too, so the dialog can't be used before converting starts.
    setPhase({ name: 'reading', file: file.name });
    let read: ResumeSource;
    try {
      read = await readResumeFile(file);
    } catch (err) {
      setPhase(inputError(err instanceof ResumeFileError ? err.message : "Couldn't read that file. Paste the text instead."));
      return;
    }
    setSource(read.text);
    setPhoto(read.photo ? await toPortraitDataUrl(read.photo).catch(() => '') : '');
    setKeepPhoto(true);
    await convert(read);
  };

  const close = () => {
    if (!busy) onClose();
  };

  // A photo needs a photo template; Essential is the plainest one. Academic CVs keep Scholar.
  const imported =
    result && photo && keepPhoto
      ? { ...result, photo, templateId: getTemplateById(result.templateId)?.photo || result.templateId !== current.templateId ? result.templateId : 'essential' }
      : result;
  const switchedTemplate = imported && imported.templateId !== current.templateId ? getTemplateById(imported.templateId) : null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={(event) => {
        if (busy) event.preventDefault();
      }}
      aria-labelledby="resume-import-title"
      data-state={phase.name === 'input' && phase.error ? 'error' : phase.name}
      className="m-auto w-[min(56rem,calc(100vw-2rem))] max-h-[calc(100vh-2rem)] overflow-hidden rounded-xl border border-rule bg-surface p-0 text-ink shadow-raised backdrop:bg-black/40"
    >
      <div className="flex max-h-[calc(100vh-2rem)] flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-rule px-5 py-4">
          <div>
            <h2 id="resume-import-title" className="text-base font-semibold">
              Import a resume
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              From a PDF, Word (.docx) or LaTeX file, or pasted text. AI fills in the editor; you check the result before anything changes.
            </p>
          </div>
          <Button variant="icon" onClick={close} aria-label="Close" disabled={busy}>
            <XIcon className="h-4 w-4" />
          </Button>
        </div>

        {!result ? (
          <div className="space-y-4 overflow-y-auto px-5 py-4">
            <div
              data-testid="resume-import-drop"
              onDragOver={(event) => {
                event.preventDefault();
                if (!busy) setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                void openFile(event.dataTransfer.files[0]);
              }}
              className={`flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition-colors ${dragging ? 'border-accent bg-accent/5' : 'border-rule bg-tint/40'}`}
            >
              <UploadIcon className="h-5 w-5 text-muted" />
              <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={busy} isLoading={phase.name === 'reading'}>
                {phase.name === 'reading' ? `Reading ${phase.file}…` : 'Choose a file'}
              </Button>
              <p className="text-xs text-muted">or drop it here · PDF, DOCX, TEX or TXT · the file stays on your device; only its text is sent to the AI</p>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.tex,.ltx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/x-tex"
                className="hidden"
                aria-label="Choose a resume file"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  void openFile(file);
                }}
              />
            </div>
            <Textarea
              label="Or paste your resume"
              value={source}
              onChange={setSource}
              minRows={8}
              disabled={busy}
              placeholder={'Pat Lee\nSoftware Engineer · pat@example.com\n\nExperience\nAcme Corp, Senior Engineer, 2021 – present\n• Led …'}
              hint="Plain text from any resume, or a .tex source. Text read from a file shows here, so you can fix it and convert again."
            />
            <Button onClick={() => void convert({ kind: looksLikeLatex(source) ? 'latex' : 'text', text: source })} isLoading={phase.name === 'converting'} disabled={!source.trim() || busy}>
              {phase.name === 'converting' ? 'Converting…' : 'Convert'}
            </Button>
            {phase.name === 'converting' && <ConversionProgress progress={phase.progress} expected={phase.expected} latex={phase.latex} />}
            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 gap-5 overflow-hidden px-5 py-4 md:grid-cols-[minmax(0,1fr)_17rem]">
            <div className="custom-scrollbar min-h-0 overflow-y-auto rounded-lg bg-tint p-4" data-testid="resume-import-preview">
              <ScaledResumePreview data={imported ?? result} mode="page" view="pages" />
            </div>
            <div className="flex flex-col gap-3 text-sm">
              <p className="font-medium">{result.fullName || 'Unnamed resume'}</p>
              <p className="text-muted">{describe(result) || 'No sections found.'}</p>
              {photo && (
                <label className="flex items-center gap-3 rounded-lg border border-rule p-2">
                  <img src={photo} alt="Photo found in your file" className="h-14 w-10.5 shrink-0 rounded object-cover" />
                  <span className="flex flex-1 items-center gap-2">
                    <input type="checkbox" checked={keepPhoto} onChange={(event) => setKeepPhoto(event.target.checked)} className="h-4 w-4 accent-[var(--site-ink)]" />
                    Use the photo from your file
                  </span>
                </label>
              )}
              {switchedTemplate && (
                <p className="text-muted">
                  Shown in {switchedTemplate.name} so {switchedTemplate.photo ? 'the photo appears' : 'the academic sections appear'}. You can change the template afterwards.
                </p>
              )}
              <p className="rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                Check every entry: AI can misread columns, tables and custom macros. Importing replaces your current resume; Undo brings it back.
              </p>
              <div className="mt-auto flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    setSource('');
                    setPhoto('');
                    setPhase(INPUT);
                    onImport(imported ?? result);
                  }}
                >
                  Replace my resume
                </Button>
                <Button variant="secondary" onClick={() => setPhase(INPUT)}>
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
