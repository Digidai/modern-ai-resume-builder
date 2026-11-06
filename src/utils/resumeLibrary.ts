import type { ResumeData } from '../types';

// Several resumes in one browser. The one being edited lives where it always has (useResumeData's
// per-field keys, which autosave and cross-tab sync use); the others are stored whole, one key each,
// and swap places with it on switching. Nothing is written until there is a second resume.

const INDEX_KEY = 'resumeLibrary:v1';
const snapshotKey = (id: string) => `${INDEX_KEY}:${id}`;

export interface ResumeEntry {
  id: string;
  name: string;
  /** When it was last the resume being edited (ms); the current one is being edited now. */
  updatedAt: number;
  templateId: string;
}

export interface ResumeLibrary {
  activeId: string;
  entries: ResumeEntry[];
}

export const newResumeId = (): string => Math.random().toString(36).slice(2, 10);

/** A name for a resume that has none yet: its job title, else its owner, else a generic one. */
export const suggestResumeName = (data: ResumeData): string => data.title.trim() || data.fullName.trim() || 'My resume';

const isEntry = (value: unknown): value is ResumeEntry => {
  const e = value as ResumeEntry;
  return !!e && typeof e.id === 'string' && typeof e.name === 'string' && typeof e.updatedAt === 'number' && typeof e.templateId === 'string';
};

/** The saved library, or a one-entry library for the resume being edited when none is saved yet. */
export const readLibrary = (): ResumeLibrary => {
  try {
    const parsed = JSON.parse(localStorage.getItem(INDEX_KEY) ?? 'null') as ResumeLibrary | null;
    if (parsed && typeof parsed.activeId === 'string' && Array.isArray(parsed.entries) && parsed.entries.every(isEntry)) {
      const entries = parsed.entries.filter((e) => e.id === parsed.activeId || localStorage.getItem(snapshotKey(e.id)) !== null);
      if (entries.some((e) => e.id === parsed.activeId)) return { activeId: parsed.activeId, entries };
    }
  } catch {
    // Fall through to a fresh library.
  }
  const id = newResumeId();
  // Unnamed: the resume being edited is named after its job title until it is renamed or stored.
  return { activeId: id, entries: [{ id, name: '', updatedAt: Date.now(), templateId: '' }] };
};

const write = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

export const writeLibrary = (library: ResumeLibrary): boolean => write(INDEX_KEY, JSON.stringify(library));
export const writeSnapshot = (id: string, data: ResumeData): boolean => write(snapshotKey(id), JSON.stringify(data));
export const removeSnapshot = (id: string): void => localStorage.removeItem(snapshotKey(id));
export const readSnapshot = (id: string): ResumeData | null => {
  try {
    // Stored by this code, so it is restored as is (no import clean-up that drops half-filled entries);
    // replaceData fills in fields added since.
    const data = JSON.parse(localStorage.getItem(snapshotKey(id)) ?? 'null') as ResumeData | null;
    return data && typeof data === 'object' && typeof data.fullName === 'string' && Array.isArray(data.experience) ? data : null;
  } catch {
    return null;
  }
};

export const isLibraryKey = (key: string | null): boolean => key === INDEX_KEY;
