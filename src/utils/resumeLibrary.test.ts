import { beforeEach, describe, expect, it } from 'vitest';
import { BLANK_RESUME_DATA } from './resumeData';
import { readLibrary, readSnapshot, removeSnapshot, writeLibrary, writeSnapshot } from './resumeLibrary';

beforeEach(() => localStorage.clear());

describe('resume library', () => {
  it('gives a stored resume back unchanged, including entries still being filled in', () => {
    const resume = {
      ...BLANK_RESUME_DATA,
      fullName: 'Sam Lee',
      experience: [{ id: 'e1', company: '', role: '', startDate: '', endDate: '', isCurrent: false, description: '' }],
      awards: [{ id: 'a1', title: '', issuer: '', year: '', detail: '' }],
    };
    writeSnapshot('b', resume);
    expect(readSnapshot('b')).toEqual(resume);
  });

  it('drops entries whose stored resume is gone, but always keeps the one being edited', () => {
    const entry = (id: string) => ({ id, name: id, updatedAt: 1, templateId: 'modern' });
    writeSnapshot('b', BLANK_RESUME_DATA);
    writeSnapshot('c', BLANK_RESUME_DATA);
    writeLibrary({ activeId: 'a', entries: [entry('a'), entry('b'), entry('c')] });
    removeSnapshot('c');
    expect(readLibrary()).toEqual({ activeId: 'a', entries: [entry('a'), entry('b')] });
  });
});
