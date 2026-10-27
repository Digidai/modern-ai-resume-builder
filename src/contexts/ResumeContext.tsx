import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import type { Dispatch, SetStateAction, FC } from 'react';
import { INITIAL_RESUME_DATA, ResumeData } from '../types';
import { useResumeData, type ResumeSaveStatus } from '../hooks/useResumeData';
import { useToast } from '../components/Toast';
import { preloadResumeTemplate } from '../components/ResumeTemplateRenderer';
import { BLANK_RESUME_DATA, sanitizeResumeData } from '../utils/resumeData';

interface ResumeContextValue {
  resumeData: ResumeData;
  setResumeData: Dispatch<SetStateAction<ResumeData>>;
  saveError: string | null;
  saveStatus: ResumeSaveStatus;
  isExportingPdf: boolean;
  handleDownloadPdf: () => Promise<void>;
  handleExportJson: () => void;
  /** Loads a JSON backup; returns false (and shows an error) if the file isn't a resume. */
  importJson: (file: File) => Promise<boolean>;
  /** Replaces the resume with a blank or sample one; the previous version can be restored from the toast. */
  startOver: (kind: 'blank' | 'sample') => void;
}

const ResumeContext = createContext<ResumeContextValue | null>(null);

const toFileBase = (name: string) =>
  (name.trim() || 'resume').replace(/\s+/g, '_').replace(/[<>:"/\\|?*\u0000-\u001F]/g, '');

export const ResumeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { resumeData, setResumeData, replaceData, saveError, saveStatus } = useResumeData();
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const { showError, showSuccess, showToast } = useToast();

  const handleDownloadPdf = useCallback(async () => {
    if (isExportingPdf) return;

    setIsExportingPdf(true);
    try {
      // PDF libraries (pdf-lib, html-to-image) are large; load them on demand.
      const [{ exportResumeToPdf }] = await Promise.all([
        import('../utils/pdfExport'),
        preloadResumeTemplate(resumeData.templateId),
      ]);
      await exportResumeToPdf({
        rawFileName: resumeData.fullName.trim() || 'resume',
        data: resumeData,
        previewElementId: 'resume-preview-container',
      });
      showSuccess('PDF downloaded.');
    } catch (error) {
      console.error(error);
      showError(error instanceof Error && error.message ? error.message : 'Failed to export PDF. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  }, [isExportingPdf, resumeData, showError, showSuccess]);

  const handleExportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(resumeData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${toFileBase(resumeData.fullName).toLowerCase()}-resume-backup.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showSuccess('Backup saved. Use “Import backup” to restore it on any device.');
  }, [resumeData, showSuccess]);

  const replaceWithUndo = useCallback(
    (next: ResumeData, message: string) => {
      const previous = resumeData;
      replaceData(next);
      showToast(message, 'success', { action: { label: 'Undo', onClick: () => replaceData(previous) } });
    },
    [replaceData, resumeData, showToast]
  );

  const importJson = useCallback(
    async (file: File) => {
      try {
        const parsed = sanitizeResumeData(JSON.parse(await file.text()));
        if (!parsed) throw new Error('not a resume');
        replaceWithUndo(parsed, 'Backup imported.');
        return true;
      } catch {
        showError('That file is not a ModernCV backup (.json).');
        return false;
      }
    },
    [replaceWithUndo, showError]
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

  const value = useMemo(
    () => ({
      resumeData,
      setResumeData,
      saveError,
      saveStatus,
      isExportingPdf,
      handleDownloadPdf,
      handleExportJson,
      importJson,
      startOver,
    }),
    [resumeData, setResumeData, saveError, saveStatus, isExportingPdf, handleDownloadPdf, handleExportJson, importJson, startOver]
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
