import { describe, expect, it } from 'vitest';
import { checkResume } from './resumeChecks';
import { INITIAL_RESUME_DATA, type ResumeData } from '../types';
import { BLANK_RESUME_DATA } from './resumeData';

const ids = (data: ResumeData, pages?: { count: number; max: number }) => checkResume(data, pages).map((c) => c.id);

describe('checkResume', () => {
  it('flags only the sample email in the example resume, and the basics in a blank one', () => {
    expect(ids(INITIAL_RESUME_DATA)).toEqual(['sample-email']);
    expect(ids(BLANK_RESUME_DATA)).toEqual(expect.arrayContaining(['name', 'contact', 'summary', 'no-history', 'skills']));
  });

  it('checks each position for dates, order, numbers and long bullets', () => {
    const exp = { id: 'x', company: 'Acme', role: 'Designer', startDate: '2022-05', endDate: '2021-01', isCurrent: false, description: `- Led redesign\n- ${'a'.repeat(201)}` };
    const checks = checkResume({ ...INITIAL_RESUME_DATA, email: 'pat@pat.dev', experience: [exp] });
    expect(checks.map((c) => c.id)).toEqual(['order-x', 'numbers-x', 'long-x']);
    expect(checks.every((c) => c.item === 'experience:x')).toBe(true);
    // A current role needs no end date and is never out of order; one digit anywhere satisfies numbers.
    expect(ids({ ...INITIAL_RESUME_DATA, email: 'pat@pat.dev', experience: [{ ...exp, isCurrent: true, endDate: '', description: '- Grew revenue 3x' }] })).toEqual([]);
    expect(ids({ ...INITIAL_RESUME_DATA, email: 'pat@pat.dev', experience: [{ ...exp, startDate: '', endDate: '', description: '- Did 4 things' }] })).toEqual(['start-x', 'end-x']);
  });

  it('flags a resume over its page target only', () => {
    const data = { ...INITIAL_RESUME_DATA, email: 'pat@pat.dev' };
    expect(ids(data, { count: 2, max: 2 })).toEqual([]);
    expect(ids(data, { count: 3, max: 2 })).toEqual(['pages']);
  });
});
