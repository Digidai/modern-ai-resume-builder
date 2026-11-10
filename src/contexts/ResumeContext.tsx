import { createContext, useContext, useState, useCallback, useMemo, useLayoutEffect, useEffect, useRef, ReactNode } from 'react';
import type { Dispatch, SetStateAction, FC } from 'react';
import { INITIAL_RESUME_DATA, ResumeData } from '../types';
import { useResumeData, type ResumeSaveStatus } from '../hooks/useResumeData';
import { useToast } from '../components/Toast';
import { preloadResumeTemplate } from '../components/ResumeTemplateRenderer';
import { BLANK_RESUME_DATA, sanitizeResumeData } from '../utils/resumeData';
import type { PdfExportProgress } from '../utils/pdfExport';
import {
  isLibraryKey,
  newResumeId,
  readLibrary,
  readSnapshot,
  removeSnapshot,
  suggestResumeName,
  writeLibrary,
  writeSnapshot,
  type ResumeEntry,
  type ResumeLibrary,
} from '../utils/resumeLibrary';

interface ResumeContextValue {
  resumeData: ResumeData;
  setResumeData: Dispatch<SetStateAction<ResumeData>>;
  saveError: string | null;
  saveStatus: ResumeSaveStatus;
  isExportingPdf: boolean;
  /** The running PDF export's stage, or null. */
  pdfProgress: PdfExportProgress | null;
  handleDownloadPdf: () => Promise<void>;
  handleExportJson: () => void;
  /** Loads a JSON backup; returns false (and shows an error) if the file isn't a resume. */
  importJson: (file: File) => Promise<boolean>;
  /** Replaces the resume with a blank or sample one; the previous version can be restored from the toast. */
  startOver: (kind: 'blank' | 'sample') => void;
  /** Replaces the resume (e.g. from an agent's `#resume=` link); the previous version can be restored from the toast. */
  loadResume: (data: ResumeData, message: string) => void;
  /** Every resume saved in this browser (null until read after hydration); `activeId` is the one being edited. */
  library: ResumeLibrary | null;
  /** Display name of a resume; the one being edited without a name is named after its job title. */
  resumeName: (entry: ResumeEntry) => string;
  switchResume: (id: string) => void;
  /** Starts another resume, blank (keeping the template and style) or a copy of this one, and edits it. */
  createResume: (kind: 'blank' | 'duplicate') => void;
  /** Edits `data` as a new resume, keeping the current one in the library (or replacing it if it is the untouched sample or empty). */
  addResume: (data: ResumeData, message: string) => void;
  renameResume: (id: string, name: string) => void;
  /** Deletes a resume that is not being edited; the toast can bring it back. */
  deleteResume: (id: string) => void;
}

// The untouched sample or an empty resume isn't worth keeping: a resume opened from elsewhere takes its place.
const content = ({ templateId: _t, design: _d, ...rest }: ResumeData) => JSON.stringify(rest);
const THROWAWAY = [INITIAL_RESUME_DATA, BLANK_RESUME_DATA].map(content);
const isThrowaway = (data: ResumeData) => THROWAWAY.includes(content(data));

const STORAGE_FULL = "This browser's storage is full, so the resume couldn't be saved. Delete a resume or remove a photo, then try again.";

const ResumeContext = createContext<ResumeContextValue | null>(null);

const toFileBase = (name: string) =>
  (name.trim() || 'resume').replace(/\s+/g, '_').replace(/[<>:"/\\|?*\u0000-\u001F]/g, '');

export const ResumeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { resumeData, setResumeData, replaceData, saveError, saveStatus } = useResumeData();
  const [pdfProgress, setPdfProgress] = useState<PdfExportProgress | null>(null);
  const isExportingPdf = pdfProgress !== null;
  const { showError, showSuccess, showToast } = useToast();

  const handleDownloadPdf = useCallback(async () => {
    if (isExportingPdf) return;

    setPdfProgress({ stage: 'preparing' });
    try {
      // PDF libraries (pdf-lib, html-to-image) are large; load them on demand.
      const loaded = await Promise.all([import('../utils/pdfExport'), preloadResumeTemplate(resumeData.templateId)]).catch(() => null);
      if (!loaded) {
        // Browsers keep failing an import that failed offline until the page reloads.
        showError(navigator.onLine ? 'Couldn’t load what the PDF needs. Reload the page and try again.' : 'You’re offline. Download the PDF once you’re back online.');
        return;
      }
      const [{ exportResumeToPdf }] = loaded;
      await exportResumeToPdf({
        data: resumeData,
        previewElementId: 'resume-preview-container',
        onProgress: setPdfProgress,
      });
      showSuccess('PDF downloaded.');
    } catch (error) {
      console.error(error);
      showError(error instanceof Error && error.message ? error.message : 'Failed to export PDF. Please try again.');
    } finally {
      setPdfProgress(null);
    }
  }, [isExportingPdf, resumeData, showError, showSuccess]);

  const replaceWithUndo = useCallback(
    (next: ResumeData, message: string) => {
      const previous = resumeData;
      const saved = replaceData(next);
      // The new resume is on screen either way; say plainly when it couldn't be stored.
      showToast(saved ? message : `${message.replace(/\.$/, '')}, but not saved: this browser's storage is full. Delete a resume or remove a photo.`, saved ? 'success' : 'error', {
        action: { label: 'Undo', onClick: () => replaceData(previous) },
      });
    },
    [replaceData, resumeData, showToast]
  );

  const startOver = useCallback(
    (kind: 'blank' | 'sample') => {
      const base = kind === 'blank' ? BLANK_RESUME_DATA : INITIAL_RESUME_DATA;
      replaceWithUndo(
        { ...base, templateId: resumeData.templateId },
        kind === 'blank' ? 'Started a blank resume.' : 'Sample resume restored.'
      );
    },
    [replaceWithUndo, resumeData.templateId]
  );

  // Read after hydration (a prerendered page renders without it), before the first paint.
  const [library, setLibrary] = useState<ResumeLibrary | null>(null);
  const libraryRef = useRef(library);
  libraryRef.current = library;
  useLayoutEffect(() => setLibrary(readLibrary()), []);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (isLibraryKey(event.key)) setLibrary(readLibrary());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const saveLibrary = useCallback((next: ResumeLibrary) => {
    setLibrary(next);
    writeLibrary(next);
  }, []);

  const resumeName = useCallback(
    (entry: ResumeEntry) => entry.name || (entry.id === library?.activeId ? suggestResumeName(resumeData) : 'Untitled resume'),
    [library?.activeId, resumeData]
  );

  /** Stores the resume being edited under its id; null if storage is full. */
  const stashActive = useCallback(
    (current: ResumeLibrary): ResumeLibrary | null => {
      if (!writeSnapshot(current.activeId, resumeData)) return null;
      const entries = current.entries.map((e) =>
        e.id === current.activeId
          ? { ...e, name: e.name || suggestResumeName(resumeData), templateId: resumeData.templateId, updatedAt: Date.now() }
          : e
      );
      return { ...current, entries };
    },
    [resumeData]
  );

  const switchResume = useCallback(
    (id: string) => {
      if (!library || id === library.activeId) return;
      const target = readSnapshot(id);
      if (!target) {
        showError("That resume couldn't be opened.");
        return;
      }
      const stashed = stashActive(library);
      if (!stashed) {
        showError(STORAGE_FULL);
        return;
      }
      if (!replaceData(target)) {
        // The stored copies are untouched; go back to the resume that was open.
        replaceData(resumeData);
        showError(STORAGE_FULL);
        return;
      }
      removeSnapshot(id);
      saveLibrary({ ...stashed, activeId: id });
    },
    [library, replaceData, resumeData, saveLibrary, showError, stashActive]
  );

  /** Keeps the current resume in the library and edits `next` as a new one; false (with an error) if it couldn't be saved. */
  const openAsNew = useCallback(
    (current: ResumeLibrary, next: ResumeData, name: string): boolean => {
      const stashed = stashActive(current);
      if (!stashed) {
        showError(STORAGE_FULL);
        return false;
      }
      if (next !== resumeData && !replaceData(next)) {
        replaceData(resumeData);
        showError(STORAGE_FULL);
        return false;
      }
      const id = newResumeId();
      saveLibrary({ activeId: id, entries: [...stashed.entries, { id, name, updatedAt: Date.now(), templateId: next.templateId }] });
      return true;
    },
    [replaceData, resumeData, saveLibrary, showError, stashActive]
  );

  const createResume = useCallback(
    (kind: 'blank' | 'duplicate') => {
      if (!library) return;
      const active = library.entries.find((e) => e.id === library.activeId);
      const ok =
        kind === 'blank'
          ? openAsNew(library, { ...BLANK_RESUME_DATA, templateId: resumeData.templateId, design: resumeData.design }, '')
          : openAsNew(library, resumeData, `${active?.name || suggestResumeName(resumeData)} (copy)`);
      if (ok) showSuccess(kind === 'blank' ? 'Started a new resume. Your other resumes are in the list.' : 'Made a copy. You are now editing the copy.');
    },
    [library, openAsNew, resumeData, showSuccess]
  );

  const addResume = useCallback(
    (next: ResumeData, message: string) => {
      if (!library || isThrowaway(resumeData)) {
        replaceWithUndo(next, message);
        return;
      }
      if (openAsNew(library, next, '')) showSuccess(`${message} Your other resumes are in the resume menu.`);
    },
    [library, openAsNew, replaceWithUndo, resumeData, showSuccess]
  );

  const renameResume = useCallback(
    (id: string, name: string) => {
      if (!library) return;
      saveLibrary({ ...library, entries: library.entries.map((e) => (e.id === id ? { ...e, name: name.trim() } : e)) });
    },
    [library, saveLibrary]
  );

  const deleteResume = useCallback(
    (id: string) => {
      if (!library || id === library.activeId) return;
      const entry = library.entries.find((e) => e.id === id);
      const data = readSnapshot(id);
      if (!entry) return;
      removeSnapshot(id);
      saveLibrary({ ...library, entries: library.entries.filter((e) => e.id !== id) });
      showToast(`Deleted “${entry.name || 'Untitled resume'}”.`, 'success', {
        action: data
          ? {
              label: 'Undo',
              onClick: () => {
                const current = libraryRef.current;
                if (!current || !writeSnapshot(id, data)) return;
                saveLibrary({ ...current, entries: [...current.entries, entry] });
              },
            }
          : undefined,
      });
    },
    [library, saveLibrary, showToast]
  );

  const download = (payload: unknown, fileName: string) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // One resume: the resume itself, as before. Several: all of them, so one file moves or restores every resume.
  const handleExportJson = useCallback(() => {
    const resumes = (library?.entries ?? [])
      .map((entry) => ({ name: resumeName(entry), data: entry.id === library?.activeId ? resumeData : readSnapshot(entry.id) }))
      .filter((resume): resume is { name: string; data: ResumeData } => resume.data !== null);
    if (resumes.length > 1) {
      download({ moderncvBackup: 1, resumes }, `moderncv-${resumes.length}-resumes-backup.json`);
      showSuccess(`Backup of all ${resumes.length} resumes saved. “Import backup” adds them to the resume menu on any device.`);
      return;
    }
    download(resumeData, `${toFileBase(resumeData.fullName).toLowerCase()}-resume-backup.json`);
    showSuccess('Backup saved. Use “Import backup” to restore it on any device.');
  }, [library, resumeData, resumeName, showSuccess]);

  const importJson = useCallback(
    async (file: File) => {
      try {
        const raw = JSON.parse(await file.text());
        if (Array.isArray(raw?.resumes)) {
          // A backup of several resumes: add them all next to the one being edited.
          const current = libraryRef.current;
          const resumes = (raw.resumes as { name?: unknown; data?: unknown }[])
            .map((r) => ({ name: typeof r?.name === 'string' ? r.name : '', data: sanitizeResumeData(r?.data) }))
            .filter((r): r is { name: string; data: ResumeData } => r.data !== null);
          if (!current || resumes.length === 0) throw new Error('not a resume');
          let base = current;
          if (current.entries.length === 1 && isThrowaway(resumeData)) {
            // A fresh browser: the first resume replaces the sample instead of sitting next to it.
            const [first] = resumes.splice(0, 1);
            if (!replaceData(first.data)) throw new Error('storage');
            base = { activeId: current.activeId, entries: [{ ...current.entries[0], name: first.name || suggestResumeName(first.data), updatedAt: Date.now(), templateId: first.data.templateId }] };
          }
          const added: ResumeEntry[] = [];
          for (const resume of resumes) {
            const id = newResumeId();
            if (!writeSnapshot(id, resume.data)) break;
            added.push({ id, name: resume.name || suggestResumeName(resume.data), updatedAt: Date.now(), templateId: resume.data.templateId });
          }
          saveLibrary({ ...base, entries: [...base.entries, ...added] });
          if (added.length < resumes.length) showError(STORAGE_FULL);
          else showSuccess(`Imported ${added.length + (base === current ? 0 : 1)} resumes from the backup. Switch between them in the resume menu.`);
          return true;
        }
        const parsed = sanitizeResumeData(raw);
        if (!parsed) throw new Error('not a resume');
        replaceWithUndo(parsed, 'Backup imported.');
        return true;
      } catch (error) {
        showError(error instanceof Error && error.message === 'storage' ? STORAGE_FULL : 'That file is not a ModernCV backup (.json).');
        return false;
      }
    },
    [replaceData, replaceWithUndo, resumeData, saveLibrary, showError, showSuccess]
  );

  const value = useMemo(
    () => ({
      resumeData,
      setResumeData,
      saveError,
      saveStatus,
      isExportingPdf,
      pdfProgress,
      handleDownloadPdf,
      handleExportJson,
      importJson,
      startOver,
      loadResume: replaceWithUndo,
      library,
      resumeName,
      switchResume,
      createResume,
      addResume,
      renameResume,
      deleteResume,
    }),
    [resumeData, setResumeData, saveError, saveStatus, isExportingPdf, pdfProgress, handleDownloadPdf, handleExportJson, importJson, startOver, replaceWithUndo, library, resumeName, switchResume, createResume, addResume, renameResume, deleteResume]
  );

  return <ResumeContext.Provider value={value}>{children}</ResumeContext.Provider>;
};

export const useResume = (): ResumeContextValue => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
};
