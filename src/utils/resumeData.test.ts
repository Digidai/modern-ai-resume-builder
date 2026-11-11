import { describe, expect, it } from 'vitest';
import { normalizeMonth, sanitizeResumeData } from './resumeData';

describe('sanitizeResumeData', () => {
  it('keeps a US Letter paper choice and reads older or unknown values as A4', () => {
    const paper = (design: unknown) => sanitizeResumeData({ fullName: 'Pat', design })?.design.paper;
    expect(paper({ paper: 'letter' })).toBe('letter');
    expect(paper({ accent: '', font: 'template', scale: 1 })).toBe('a4');
    expect(paper({ paper: 'legal' })).toBe('a4');
  });

  it('opens a resume saved with a retired template in its replacement, and leaves other ids alone', () => {
    const template = (templateId: unknown) => sanitizeResumeData({ fullName: 'Pat', templateId })?.templateId;
    expect(template('pearl')).toBe('aurora');
    expect(template('quill')).toBe('folio');
    expect(template('classic')).toBe('classic');
    expect(template('constructor')).toBe('constructor');
  });

  it('imports a JSON Resume document', () => {
    const result = sanitizeResumeData({
      basics: {
        name: 'Ada Lovelace',
        label: 'Data Engineer',
        email: 'ada@example.com',
        url: 'https://ada.dev',
        summary: 'Builds pipelines.',
        location: { city: 'London', countryCode: 'GB' },
        profiles: [
          { network: 'GitHub', url: 'https://github.com/ada' },
          { network: 'LinkedIn', url: 'https://linkedin.com/in/ada' },
        ],
      },
      work: [
        { name: 'Acme', position: 'Lead', startDate: '2021-03-15', summary: 'Owned the platform.', highlights: ['Cut costs 30%'] },
        { name: 'Initech', position: 'Engineer', startDate: '2018', endDate: '2021-02-01' },
      ],
      education: [{ institution: 'UCL', studyType: 'BSc', area: 'Mathematics', startDate: '2014-09', endDate: '2017-06' }],
      skills: [{ name: 'Languages', keywords: ['Python', 'SQL'] }, { name: 'Leadership' }],
      projects: [{ name: 'Engine', url: 'github.com/ada/engine', highlights: ['Analytical'] }],
    });

    expect(result).toMatchObject({
      fullName: 'Ada Lovelace',
      title: 'Data Engineer',
      website: 'https://ada.dev',
      linkedin: 'https://linkedin.com/in/ada',
      // Profiles other than LinkedIn become extra links.
      links: [{ label: 'GitHub', url: 'https://github.com/ada' }],
      location: 'London, GB',
      skills: ['Languages: Python, SQL', 'Leadership'],
      education: [{ school: 'UCL', degree: 'BSc in Mathematics', startDate: '2014-09', endDate: '2017-06' }],
      projects: [{ name: 'Engine', link: 'github.com/ada/engine', description: '- Analytical' }],
    });
    expect(result?.experience).toMatchObject([
      { company: 'Acme', role: 'Lead', startDate: '2021-03', endDate: '', isCurrent: true, description: 'Owned the platform.\n- Cut costs 30%' },
      { company: 'Initech', startDate: '2018', endDate: '2021-02', isCurrent: false },
    ]);
  });

  it('keeps hours per week as text, accepting a number from agents and dropping blanks', () => {
    const result = sanitizeResumeData({
      fullName: 'Pat',
      experience: [{ role: 'Analyst', hours: 40 }, { role: 'Clerk', hours: ' 20 hours ' }, { role: 'Intern', hours: '  ' }],
    });
    expect(result?.experience.map((exp) => exp.hours)).toEqual(['40', '20 hours', undefined]);
  });

  it('keeps profile links with a URL and drops empty ones', () => {
    const result = sanitizeResumeData({
      fullName: 'Pat',
      links: [{ label: ' Portfolio ', url: 'pat.dev' }, { label: 'Empty', url: '  ' }, 'junk', { url: 'x.com/pat' }],
    });
    expect(result?.links).toMatchObject([
      { label: 'Portfolio', url: 'pat.dev' },
      { label: '', url: 'x.com/pat' },
    ]);
    expect(sanitizeResumeData({ fullName: 'Old backup' })?.links).toEqual([]);
  });

  it('keeps JSON Resume certificates, languages, interests, volunteer roles and grades', () => {
    const result = sanitizeResumeData({
      basics: { name: 'Ada Lovelace' },
      work: [{ name: 'Acme', position: 'Lead', startDate: '2021-03' }],
      volunteer: [{ organization: 'Code Club', position: 'Mentor', startDate: '2019-01', endDate: '2020-06', highlights: ['Taught 30 pupils'] }],
      education: [{ institution: 'UCL', studyType: 'BSc', area: 'Mathematics', score: '3.8/4.0' }, { institution: 'Oxford', studyType: 'MA', score: 'First Class Honours' }],
      skills: [{ name: 'Languages', keywords: ['Python', 'SQL'] }],
      certificates: [{ name: 'AWS Solutions Architect', issuer: 'Amazon Web Services', date: '2023-05-01' }, { name: 'PMP' }],
      languages: [{ language: 'English', fluency: 'Native' }, { language: 'French' }],
      interests: [{ name: 'Outdoors', keywords: ['Hiking', 'Climbing'] }, { name: 'Chess' }],
    });

    expect(result?.experience).toMatchObject([
      { company: 'Acme', role: 'Lead' },
      { company: 'Code Club', role: 'Mentor', startDate: '2019-01', endDate: '2020-06', isCurrent: false, description: '- Taught 30 pupils' },
    ]);
    expect(result?.education.map((e) => e.degree)).toEqual(['BSc in Mathematics; GPA 3.8/4.0', 'MA; First Class Honours']);
    // Spoken languages get their own label when "Languages" already lists programming languages.
    expect(result?.skills).toEqual([
      'Languages: Python, SQL',
      'Certifications: AWS Solutions Architect (Amazon Web Services, 2023), PMP',
      'Spoken languages: English (Native), French',
      'Interests: Hiking, Climbing, Chess',
    ]);
    expect(sanitizeResumeData({ basics: { name: 'Pat' }, languages: [{ language: 'Spanish', fluency: 'Fluent' }] })?.skills).toEqual(['Languages: Spanish (Fluent)']);
  });

  it('keeps only inline raster photos, including a JSON Resume basics.image', () => {
    const jpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
    expect(sanitizeResumeData({ fullName: 'Pat', photo: jpeg })?.photo).toBe(jpeg);
    expect(sanitizeResumeData({ basics: { name: 'Pat', image: jpeg } })?.photo).toBe(jpeg);
    // Remote URLs would load from the network when the PDF renders; SVG can carry scripts.
    expect(sanitizeResumeData({ fullName: 'Pat', photo: 'https://example.com/me.jpg' })?.photo).toBeUndefined();
    expect(sanitizeResumeData({ fullName: 'Pat', photo: 'data:image/svg+xml;base64,PHN2Zz4=' })?.photo).toBeUndefined();
    expect(sanitizeResumeData({ fullName: 'Pat', photo: `data:image/png;base64,${'A'.repeat(200_000)}` })?.photo).toBeUndefined();
  });

  it('imports publications, including JSON Resume ones, and drops empty entries', () => {
    const result = sanitizeResumeData({
      basics: { name: 'Pat Lee' },
      publications: [{ name: 'Sparse attention', publisher: 'NeurIPS', releaseDate: '2025-12-01', url: 'doi.org/10.1/x' }, {}],
    });
    expect(result?.publications).toMatchObject([{ title: 'Sparse attention', venue: 'NeurIPS', year: '2025', link: 'doi.org/10.1/x', authors: '' }]);
    expect(sanitizeResumeData({ fullName: 'Pat' })?.publications).toBeUndefined();
  });

  it('imports grants, awards, talks and teaching, including JSON Resume awards, and drops empty entries', () => {
    const result = sanitizeResumeData({
      basics: { name: 'Pat' },
      awards: [{ title: 'Graduate Fellowship', awarder: 'NSF', date: '2023-09-01', summary: '$138,000' }, {}],
    });
    expect(result?.awards).toMatchObject([{ title: 'Graduate Fellowship', issuer: 'NSF', year: '2023', detail: '$138,000' }]);
    const own = sanitizeResumeData({
      fullName: 'Pat',
      awards: [{ title: ' Best Paper ', issuer: 'CHI', year: '2025' }, { title: ' ', issuer: '' }],
      talks: [{ title: 'Sparse attention', event: 'NeurIPS', year: '2025' }, { location: 'Paris' }],
      teaching: [{ course: ' CS 229 ', role: 'Teaching Assistant', year: '2024' }, { institution: 'Stanford' }],
    });
    expect(own?.awards).toMatchObject([{ title: 'Best Paper', issuer: 'CHI', year: '2025', detail: '' }]);
    expect(own?.talks).toMatchObject([{ title: 'Sparse attention', event: 'NeurIPS', location: '', year: '2025' }]);
    expect(sanitizeResumeData({ fullName: 'Pat' })?.awards).toBeUndefined();
    expect(own?.teaching).toMatchObject([{ course: 'CS 229', role: 'Teaching Assistant', institution: '', year: '2024' }]);
    expect(sanitizeResumeData({ fullName: 'Pat' })?.talks).toBeUndefined();
    expect(sanitizeResumeData({ fullName: 'Pat' })?.teaching).toBeUndefined();
  });

  it('rejects JSON that is not a resume', () => {
    expect(sanitizeResumeData({ foo: 1 })).toBeNull();
    expect(sanitizeResumeData([1, 2])).toBeNull();
  });
});

describe('normalizeMonth', () => {
  it('turns months typed without a month picker into YYYY-MM', () => {
    expect(normalizeMonth('Jan 2020')).toBe('2020-01');
    expect(normalizeMonth(' Sept. 2021 ')).toBe('2021-09');
    expect(normalizeMonth('March, 2019')).toBe('2019-03');
    expect(normalizeMonth('2020/3')).toBe('2020-03');
    expect(normalizeMonth('2020.11')).toBe('2020-11');
    expect(normalizeMonth('03/2021')).toBe('2021-03');
    expect(normalizeMonth('2020年3月')).toBe('2020-03');
    expect(normalizeMonth('2020-03')).toBe('2020-03');
  });

  it('keeps years, impossible months and other text as typed', () => {
    for (const typed of ['2019', '', '2020/13', '13/2020', 'Ma 2020', 'Summer 2020', 'Jan', 'Expected 2026']) {
      expect(normalizeMonth(typed)).toBe(typed);
    }
  });
});
