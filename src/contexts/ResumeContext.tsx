import { createContext, useContext, useState, useCallback, useMemo, ReactNode, ComponentType } from 'react';
import type { Dispatch, SetStateAction, FC } from 'react';
import { ResumeData } from '../types';
import { useResumeData } from '../hooks/useResumeData';
import { exportResumeToPdf } from '../utils/pdfExport';
import { useToast } from '../components/Toast';
import { preloadResumeTemplate } from '../components/ResumeTemplateRenderer';

interface ResumeContextValue {
  resumeData: ResumeData;
  setResumeData: Dispatch<SetStateAction<ResumeData>>;
  resetData: () => void;
  saveError: string | null;
  isExportingPdf: boolean;
  handleDownloadPdf: () => Promise<void>;
  handleExportJson: () => void;
}

const ResumeContext = createContext<ResumeContextValue | null>(null);

interface ResumeProviderProps {
  children: ReactNode;
}

const ResumeProviderInner: FC<ResumeProviderProps> = ({ children }) => {
  const { resumeData, setResumeData, resetData, saveError } = useResumeData();
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const { showError } = useToast();

  const handleDownloadPdf = useCallback(async () => {
    if (isExportingPdf) return;

    setIsExportingPdf(true);
    try {
      await preloadResumeTemplate(resumeData.templateId);
      const fileBase = resumeData.fullName.trim() || 'resume';
      await exportResumeToPdf({
        rawFileName: fileBase,
        data: resumeData,
        previewElementId: 'resume-preview-container',
      });
    } catch (error) {
      console.error(error);
      const message = error instanceof Error && error.message ? error.message : 'Failed to export PDF. Please try again.';
      showError(message);
    } finally {
      setIsExportingPdf(false);
    }
  }, [isExportingPdf, resumeData, showError]);

  const handleExportJson = useCallback(() => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(resumeData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${(resumeData.fullName || 'resume').replace(/\s+/g, '_').toLowerCase()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }, [resumeData]);

  const value = useMemo(() => ({
    resumeData,
    setResumeData,
    resetData,
    saveError,
    isExportingPdf,
    handleDownloadPdf,
    handleExportJson,
  }), [resumeData, setResumeData, resetData, saveError, isExportingPdf, handleDownloadPdf, handleExportJson]);

  return (
    <ResumeContext.Provider value={value}>
      {children}
    </ResumeContext.Provider>
  );
};

export const ResumeProvider: FC<ResumeProviderProps> = ({ children }) => {
  return (
    <ResumeProviderInner>{children}</ResumeProviderInner>
  );
};

export const useResume = (): ResumeContextValue => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
};
