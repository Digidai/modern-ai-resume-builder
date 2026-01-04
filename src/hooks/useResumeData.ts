import { useState, useEffect, useCallback } from 'react';
import { ResumeData, INITIAL_RESUME_DATA } from '../types';

const STORAGE_KEY = 'resumeData';

const isValidResumeData = (data: unknown): data is Partial<ResumeData> => {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (obj.fullName !== undefined && typeof obj.fullName !== 'string') return false;
  if (obj.experience !== undefined && !Array.isArray(obj.experience)) return false;
  if (obj.education !== undefined && !Array.isArray(obj.education)) return false;
  if (obj.skills !== undefined && !Array.isArray(obj.skills)) return false;
  return true;
};

const loadFromStorage = (): ResumeData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!isValidResumeData(parsed)) {
        console.warn('Corrupted resume data detected, using defaults');
        localStorage.removeItem(STORAGE_KEY);
        return INITIAL_RESUME_DATA;
      }
      return { ...INITIAL_RESUME_DATA, ...parsed };
    }
  } catch (e) {
    if (e instanceof SyntaxError) {
      console.error('Failed to parse resume data:', e);
      localStorage.removeItem(STORAGE_KEY);
    } else {
      console.error('Failed to load resume data:', e);
    }
  }
  return INITIAL_RESUME_DATA;
};

const saveToStorage = (data: ResumeData): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    const isQuotaError = e instanceof DOMException && (
      e.name === 'QuotaExceededError' || 
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    );
    
    if (isQuotaError) {
      console.error('Storage quota exceeded. Some changes may not be saved.');
    } else {
      console.error('Failed to save resume data:', e);
    }
    return false;
  }
};

export const useResumeData = () => {
  const [resumeData, setResumeData] = useState<ResumeData>(loadFromStorage);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const success = saveToStorage(resumeData);
    setSaveError(success ? null : 'Failed to save changes');
  }, [resumeData]);

  const resetData = useCallback(() => {
    if (window.confirm('Are you sure you want to reset all data to defaults? This cannot be undone.')) {
      setResumeData(INITIAL_RESUME_DATA);
      localStorage.removeItem(STORAGE_KEY);
      setSaveError(null);
    }
  }, []);

  return {
    resumeData,
    setResumeData,
    resetData,
    saveError,
  };
};
