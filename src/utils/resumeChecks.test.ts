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

  it('asks older roles for numbers only when they have three or more bullets, and measures CJK bullets by printed width', () => {
    const base = { ...INITIAL_RESUME_DATA, email: 'pat@pat.dev' };
    const old = (description: string) => ({ id: 'o', company: 'Old Co', role: 'Intern', startDate: '2015-01', endDate: '2016-01', isCurrent: false, description });
    expect(ids({ ...base, experience: [base.experience[0], old('- Cleaned survey data\n- Wrote reports')] })).toEqual([]);
    expect(ids({ ...base, experience: [base.experience[0], old('- Cleaned data\n- Wrote reports\n- Ran interviews')] })).toEqual(['numbers-o']);
    // 120 CJK characters print as wide as 240 Latin ones; 120 Latin ones are fine.
    expect(ids({ ...base, experience: [old(`- 负责${'数'.repeat(117)}3`)] })).toEqual(['long-o']);
    expect(ids({ ...base, experience: [old(`- 1 ${'a'.repeat(118)}`)] })).toEqual([]);
  });

  it('counts the skills inside a group, not the groups', () => {
    const base = { ...INITIAL_RESUME_DATA, email: 'pat@pat.dev' };
    expect(ids({ ...base, skills: ['Languages: Go, Python, SQL', 'Tools: Docker, AWS'] })).toEqual([]);
    expect(ids({ ...base, skills: ['语言：Go、Python、SQL'] })).toEqual([]);
    expect(ids({ ...base, skills: ['Languages: Go', 'Figma'] })).toEqual(['skills']);
    expect(ids({ ...base, skills: ['Languages:', 'Tools:', 'Figma'] })).toEqual(['skills']);
  });

  it('flags a resume over its page target only', () => {
    const data = { ...INITIAL_RESUME_DATA, email: 'pat@pat.dev' };
    expect(ids(data, { count: 2, max: 2 })).toEqual([]);
    expect(ids(data, { count: 3, max: 2 })).toEqual(['pages']);
  });
});
