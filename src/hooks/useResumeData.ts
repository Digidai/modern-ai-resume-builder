import { useState, useEffect, useCallback, useRef } from 'react';
import { ResumeData, INITIAL_RESUME_DATA } from '../types';

const STORAGE_KEY = 'resumeData';
const SAVE_DEBOUNCE_MS = 300;

const isValidResumeData = (data: unknown): data is Partial<ResumeData> => {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (obj.fullName !== undefined && typeof obj.fullName !== 'string') return false;
  if (obj.experience !== undefined && !Array.isArray(obj.experience)) return false;
  if (obj.education !== undefined && !Array.isArray(obj.education)) return false;
  if (obj.skills !== undefined && !Array.isArray(obj.skills)) return false;
  return true;
};

const mergeResumeData = (data: Partial<ResumeData>): ResumeData => ({
  ...INITIAL_RESUME_DATA,
  ...data,
});

const areResumeDataEqual = (a: ResumeData, b: ResumeData): boolean => {
  return JSON.stringify(a) === JSON.stringify(b);
};

const loadFromStorage = (): ResumeData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return INITIAL_RESUME_DATA;

    const parsed = JSON.parse(saved);
    if (!isValidResumeData(parsed)) {
      console.warn('Corrupted resume data detected, using defaults');
      localStorage.removeItem(STORAGE_KEY);
      return INITIAL_RESUME_DATA;
    }

    return mergeResumeData(parsed);
  } catch (error) {
    console.error('Failed to load resume data:', error);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (removeError) {
      console.warn('Failed to remove data after load error:', removeError);
    }
    return INITIAL_RESUME_DATA;
  }
};

const saveToStorage = (data: ResumeData): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    const isQuotaError =
      error instanceof DOMException &&
      (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');

    if (isQuotaError) {
      console.error('Storage quota exceeded. Some changes may not be saved.');
    } else {
      console.error('Failed to save resume data:', error);
    }

    return false;
  }
};

export const useResumeData = () => {
  const [resumeData, setResumeData] = useState<ResumeData>(loadFromStorage);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveTimerRef = useRef<number | null>(null);

  const flushSave = useCallback((nextData: ResumeData) => {
    const success = saveToStorage(nextData);
    setSaveError(success ? null : 'Failed to save changes');
  }, []);

  useEffect(() => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      flushSave(resumeData);
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [flushSave, resumeData]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;

      if (!event.newValue) {
        setResumeData((prev) => (areResumeDataEqual(prev, INITIAL_RESUME_DATA) ? prev : INITIAL_RESUME_DATA));
        setSaveError(null);
        return;
      }

      try {
        const parsed = JSON.parse(event.newValue);
        if (!isValidResumeData(parsed)) return;

        const nextData = mergeResumeData(parsed);
        setResumeData((prev) => (areResumeDataEqual(prev, nextData) ? prev : nextData));
        setSaveError(null);
      } catch (error) {
        console.warn('Ignored malformed resume data from another tab:', error);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const resetData = useCallback(() => {
    if (!window.confirm('Are you sure you want to reset all data to defaults? This cannot be undone.')) {
      return;
    }

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    setResumeData(INITIAL_RESUME_DATA);
    localStorage.removeItem(STORAGE_KEY);
    setSaveError(null);
  }, []);

  return {
    resumeData,
    setResumeData,
    resetData,
    saveError,
  };
};
