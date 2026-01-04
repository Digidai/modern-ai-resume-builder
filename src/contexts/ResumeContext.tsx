import { createContext, useContext, useState, useCallback, useMemo, ReactNode, ComponentType } from 'react';
import type { Dispatch, SetStateAction, FC } from 'react';
import { ResumeData } from '../types';
import { useResumeData } from '../hooks/useResumeData';
import { exportResumeToPdf } from '../utils/pdfExport';
import { useToast } from '../components/Toast';

interface ResumeContextValue {
  resumeData: ResumeData;
  setResumeData: Dispatch<SetStateAction<ResumeData>>;
  resetData: () => void;
  isExportingPdf: boolean;
  handleDownloadPdf: () => Promise<void>;
  handleExportJson: () => void;
}

const ResumeContext = createContext<ResumeContextValue | null>(null);

interface ResumeProviderProps {
  children: ReactNode;
}

const ResumeProviderInner: FC<ResumeProviderProps> = ({ children }) => {
  const { resumeData, setResumeData, resetData } = useResumeData();
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const { showError } = useToast();

  const handleDownloadPdf = useCallback(async () => {
    if (isExportingPdf) return;

    const preview = document.getElementById('resume-preview-container');
    if (!preview) {
      showError('Resume preview is not ready yet.');
      return;
    }

    setIsExportingPdf(true);
    try {
      const fileBase = resumeData.fullName.trim() || 'resume';
      await exportResumeToPdf(preview, fileBase, resumeData);
    } catch (error) {
      console.error(error);
      showError('Failed to export PDF. Please try again.');
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
    isExportingPdf,
    handleDownloadPdf,
    handleExportJson,
  }), [resumeData, setResumeData, resetData, isExportingPdf, handleDownloadPdf, handleExportJson]);

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
