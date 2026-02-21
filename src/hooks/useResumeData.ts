import { useState, useEffect, useCallback, useRef } from 'react';
import { ResumeData, INITIAL_RESUME_DATA } from '../types';

const LEGACY_STORAGE_KEY = 'resumeData';
const STORAGE_PREFIX = 'resumeData:v2';
const STORAGE_VERSION_KEY = `${STORAGE_PREFIX}:version`;
const STORAGE_VERSION = '2';
const SAVE_DEBOUNCE_MS = 300;
const SAVED_STATUS_DURATION_MS = 1500;

export type ResumeSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const RESUME_FIELDS: Array<keyof ResumeData> = [
  'templateId',
  'fullName',
  'title',
  'email',
  'phone',
  'location',
  'website',
  'linkedin',
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
];

const SESSION_SCOPED_FIELDS = new Set<keyof ResumeData>([
  'fullName',
  'email',
  'phone',
  'location',
  'website',
  'linkedin',
  'summary',
  'experience',
  'education',
  'projects',
]);

const getStorageForField = (field: keyof ResumeData): Storage =>
  SESSION_SCOPED_FIELDS.has(field) ? sessionStorage : localStorage;

const isValidResumeData = (data: unknown): data is Partial<ResumeData> => {
  if (typeof data !== 'object' || data === null) return false;

  const obj = data as Record<string, unknown>;
  if (obj.fullName !== undefined && typeof obj.fullName !== 'string') return false;
  if (obj.experience !== undefined && !Array.isArray(obj.experience)) return false;
  if (obj.education !== undefined && !Array.isArray(obj.education)) return false;
  if (obj.skills !== undefined && !Array.isArray(obj.skills)) return false;
  if (obj.projects !== undefined && !Array.isArray(obj.projects)) return false;

  return true;
};

const mergeResumeData = (data: Partial<ResumeData>): ResumeData => ({
  ...INITIAL_RESUME_DATA,
  ...data,
});

const getFieldStorageKey = (field: keyof ResumeData): string => `${STORAGE_PREFIX}:${field}`;

const isKnownField = (value: string): value is keyof ResumeData => {
  return (RESUME_FIELDS as string[]).includes(value);
};

const isValidFieldValue = (field: keyof ResumeData, value: unknown): boolean => {
  switch (field) {
    case 'templateId':
    case 'fullName':
    case 'title':
    case 'email':
    case 'phone':
    case 'location':
    case 'website':
    case 'linkedin':
    case 'summary':
      return typeof value === 'string';
    case 'experience':
    case 'education':
    case 'skills':
    case 'projects':
      return Array.isArray(value);
    default:
      return false;
  }
};

const clearSegmentedStorage = (): void => {
  for (const field of RESUME_FIELDS) {
    getStorageForField(field).removeItem(getFieldStorageKey(field));
  }
  localStorage.removeItem(STORAGE_VERSION_KEY);
};

const loadFromSegmentedStorage = (): Partial<ResumeData> | null => {
  const nextData: Partial<ResumeData> = {};
  let hasAnyField = false;

  for (const field of RESUME_FIELDS) {
    const storage = getStorageForField(field);
    const raw = storage.getItem(getFieldStorageKey(field));
    if (raw === null) continue;

    hasAnyField = true;

    try {
      const parsed = JSON.parse(raw);
      if (!isValidFieldValue(field, parsed)) {
        storage.removeItem(getFieldStorageKey(field));
        continue;
      }

      nextData[field] = parsed as ResumeData[typeof field];
    } catch {
      storage.removeItem(getFieldStorageKey(field));
    }
  }

  if (!hasAnyField) return null;
  return isValidResumeData(nextData) ? nextData : null;
};

const loadLegacyData = (): Partial<ResumeData> | null => {
  const saved = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!saved) return null;

  try {
    const parsed = JSON.parse(saved);
    if (!isValidResumeData(parsed)) {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    return null;
  }
};

const loadFromStorage = (): ResumeData => {
  try {
    const segmentedData = loadFromSegmentedStorage();
    if (segmentedData) {
      return mergeResumeData(segmentedData);
    }

    const legacyData = loadLegacyData();
    if (legacyData) {
      return mergeResumeData(legacyData);
    }
  } catch (error) {
    console.error('Failed to load resume data:', error);
  }

  return INITIAL_RESUME_DATA;
};

const saveFieldsToStorage = (data: ResumeData, fields: Array<keyof ResumeData>): boolean => {
  try {
    for (const field of fields) {
      getStorageForField(field).setItem(getFieldStorageKey(field), JSON.stringify(data[field]));
    }

    localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
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
  const [saveStatus, setSaveStatus] = useState<ResumeSaveStatus>('idle');

  const saveTimerRef = useRef<number | null>(null);
  const saveStatusTimerRef = useRef<number | null>(null);
  const pendingFieldsRef = useRef<Set<keyof ResumeData>>(new Set());
  const latestDataRef = useRef<ResumeData>(resumeData);
  const previousDataRef = useRef<ResumeData>(resumeData);
  const hasInitializedRef = useRef(false);

  const flushSave = useCallback(() => {
    const pendingFields = Array.from(pendingFieldsRef.current);
    if (pendingFields.length === 0) return;

    pendingFieldsRef.current.clear();
    if (saveStatusTimerRef.current !== null) {
      window.clearTimeout(saveStatusTimerRef.current);
      saveStatusTimerRef.current = null;
    }
    const success = saveFieldsToStorage(latestDataRef.current, pendingFields);
    if (success) {
      setSaveError(null);
      setSaveStatus('saved');
      saveStatusTimerRef.current = window.setTimeout(() => {
        setSaveStatus('idle');
        saveStatusTimerRef.current = null;
      }, SAVED_STATUS_DURATION_MS);
    } else {
      setSaveError('Failed to save changes locally');
      setSaveStatus('error');
    }
  }, []);

  useEffect(() => {
    latestDataRef.current = resumeData;

    const changedFields = hasInitializedRef.current
      ? RESUME_FIELDS.filter((field) => !Object.is(previousDataRef.current[field], resumeData[field]))
      : [...RESUME_FIELDS];

    previousDataRef.current = resumeData;
    hasInitializedRef.current = true;

    if (changedFields.length === 0) return;

    for (const field of changedFields) {
      pendingFieldsRef.current.add(field);
    }

    setSaveStatus('saving');

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      flushSave();
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
      if (!event.key) return;

      if (event.key === LEGACY_STORAGE_KEY) {
        if (!event.newValue) return;

        try {
          const parsed = JSON.parse(event.newValue);
          if (!isValidResumeData(parsed)) return;

          const merged = mergeResumeData(parsed);
          setResumeData((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(merged)) return prev;
            return merged;
          });
          setSaveError(null);
          setSaveStatus('idle');
        } catch {
          // Ignore malformed legacy payloads from other tabs.
        }

        return;
      }

      if (!event.key.startsWith(`${STORAGE_PREFIX}:`) || event.key === STORAGE_VERSION_KEY) {
        return;
      }

      const fieldName = event.key.slice(`${STORAGE_PREFIX}:`.length);
      if (!isKnownField(fieldName)) return;

      const expectedStorage = getStorageForField(fieldName);
      if (event.storageArea && event.storageArea !== expectedStorage) {
        return;
      }

      if (event.newValue === null) {
        setResumeData((prev) => ({
          ...prev,
          [fieldName]: INITIAL_RESUME_DATA[fieldName],
        }));
        setSaveError(null);
        setSaveStatus('idle');
        return;
      }

      try {
        const parsed = JSON.parse(event.newValue);
        if (!isValidFieldValue(fieldName, parsed)) return;

        setResumeData((prev) => {
          if (Object.is(prev[fieldName], parsed)) return prev;
          return {
            ...prev,
            [fieldName]: parsed,
          };
        });
        setSaveError(null);
        setSaveStatus('idle');
      } catch {
        // Ignore malformed field payloads from other tabs.
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

    if (saveStatusTimerRef.current !== null) {
      window.clearTimeout(saveStatusTimerRef.current);
      saveStatusTimerRef.current = null;
    }

    pendingFieldsRef.current.clear();
    clearSegmentedStorage();
    localStorage.removeItem(LEGACY_STORAGE_KEY);

    previousDataRef.current = INITIAL_RESUME_DATA;
    latestDataRef.current = INITIAL_RESUME_DATA;
    hasInitializedRef.current = false;

    setResumeData(INITIAL_RESUME_DATA);
    setSaveError(null);
    setSaveStatus('idle');
  }, []);

  useEffect(() => {
    return () => {
      if (saveStatusTimerRef.current !== null) {
        window.clearTimeout(saveStatusTimerRef.current);
      }
    };
  }, []);

  return {
    resumeData,
    setResumeData,
    resetData,
    saveError,
    saveStatus,
  };
};
