import { describe, expect, it } from 'vitest';
import { titleMatchRank } from './jobTitleSearch';

describe('titleMatchRank', () => {
  it('matches the words typed in any order, as word starts', () => {
    expect(titleMatchRank('Elementary School Teacher', 'elementary teacher')).toBe(1);
    expect(titleMatchRank('Senior Software Engineer', 'engineer software')).toBe(1);
    expect(titleMatchRank('Software Engineer', 'software eng')).toBe(1);
    expect(titleMatchRank('Software Engineer', 'hardware engineer')).toBeNull();
  });

  it('ignores spaces and hyphens inside a word, wherever it sits in the title', () => {
    expect(titleMatchRank('Frontend Developer', 'front-end developer')).toBe(1);
    expect(titleMatchRank('Senior Frontend Developer', 'front end')).toBe(1);
    expect(titleMatchRank('Full Stack Developer', 'fullstack developer')).toBe(1);
    expect(titleMatchRank('UI/UX Designer', 'ux/ui designer')).toBe(1);
    expect(titleMatchRank('Node.js Developer', 'nodejs')).toBe(1);
  });

  it('reads plurals and common abbreviations', () => {
    expect(titleMatchRank('Registered Nurse (RN)', 'nurses')).toBe(1);
    expect(titleMatchRank('Data Entry Clerk', 'data entries')).toBe(1);
    expect(titleMatchRank('HR Manager', 'human resources manager')).toBe(1);
    expect(titleMatchRank('VP of Human Resources', 'hr')).toBe(1);
    expect(titleMatchRank('Machine Learning Engineer', 'ml engineer')).toBe(1);
    expect(titleMatchRank('Senior Data Scientist', 'sr data scientist')).toBe(1);
  });

  it('ranks letters inside a word below whole words, and keeps a leading dot', () => {
    expect(titleMatchRank('Registered Nurse (RN)', 'rn')).toBe(1);
    expect(titleMatchRank('Software Engineer Intern', 'rn')).toBe(2);
    expect(titleMatchRank('.NET Developer', '.net')).toBe(1);
    expect(titleMatchRank('Network Engineer', '.net')).toBeNull();
    expect(titleMatchRank('Teacher', '  ')).toBeNull();
  });
});
