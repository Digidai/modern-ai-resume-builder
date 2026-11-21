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

describe('loosely shaped resumes from agents', () => {
  it('reads the name, headline, summary and location under other common names', () => {
    const result = sanitizeResumeData({
      name: 'Pat Lee',
      headline: 'Staff Engineer',
      about: 'Builds reliable systems.',
      location: { city: 'San Francisco', state: 'CA', country: 'USA' },
      experience: [],
    });
    expect(result).toMatchObject({ fullName: 'Pat Lee', title: 'Staff Engineer', summary: 'Builds reliable systems.', location: 'San Francisco, CA, USA' });
    // A file that only has a "name" (package.json, say) is still not a resume.
    expect(sanitizeResumeData({ name: 'modern-ai-resume-builder', version: '1.0.0' })).toBeNull();
  });

  it('keeps numeric years and academic entries written with other field names', () => {
    const result = sanitizeResumeData({
      fullName: 'Pat',
      education: [{ school: 'UCL', degree: 'PhD', startDate: 2016, endDate: 2020 }],
      publications: [{ name: 'Sparse Attention', authors: ['P. Lee', 'J. Doe'], journal: 'NeurIPS', year: 2023, doi: '10.1234/abcd' }],
      awards: [{ name: 'Best Paper', awarder: 'ICML', date: '2022' }],
      talks: [{ title: 'Scaling laws', venue: 'Stanford NLP Seminar', year: 2024 }],
      teaching: [{ title: 'CS 229', role: 'TA', university: 'Stanford', year: 2019 }],
    });
    expect(result?.education).toMatchObject([{ startDate: '2016', endDate: '2020' }]);
    expect(result?.publications).toMatchObject([{ title: 'Sparse Attention', authors: 'P. Lee, J. Doe', venue: 'NeurIPS', year: '2023', link: 'https://doi.org/10.1234/abcd' }]);
    expect(result?.awards).toMatchObject([{ title: 'Best Paper', issuer: 'ICML', year: '2022' }]);
    expect(result?.talks).toMatchObject([{ title: 'Scaling laws', event: 'Stanford NLP Seminar', year: '2024' }]);
    expect(result?.teaching).toMatchObject([{ course: 'CS 229', institution: 'Stanford', year: '2019' }]);
  });

  it('reads the field names agents commonly use, and links as plain URLs', () => {
    const result = sanitizeResumeData({
      fullName: 'Pat',
      github: 'github.com/pat',
      links: ['pat.dev', 'https://www.github.com/pat/', { name: 'Scholar', href: 'scholar.google.com/citations?user=x' }],
      experience: [{ title: 'Senior Engineer', employer: 'Acme' }, { role: 'Intern', company: 'Beta', title: 'ignored' }],
      education: [{ institution: 'UCL', studyType: 'BSc', area: 'Mathematics' }, { university: 'MIT', degree: 'PhD' }],
      projects: [{ title: 'Engine', url: 'github.com/pat/engine' }],
    });
    expect(result?.experience).toMatchObject([{ role: 'Senior Engineer', company: 'Acme' }, { role: 'Intern', company: 'Beta' }]);
    expect(result?.education).toMatchObject([{ school: 'UCL', degree: 'BSc in Mathematics' }, { school: 'MIT', degree: 'PhD' }]);
    expect(result?.projects).toMatchObject([{ name: 'Engine', link: 'github.com/pat/engine' }]);
    // The github field repeats a link already listed, so it is added once.
    expect(result?.links.map(({ label, url }) => [label, url])).toEqual([
      ['', 'pat.dev'],
      ['', 'https://www.github.com/pat/'],
      ['Scholar', 'scholar.google.com/citations?user=x'],
    ]);
  });

  it('keeps bullets sent as lists and skills sent as groups or one string', () => {
    const result = sanitizeResumeData({
      fullName: 'Pat',
      experience: [
        { company: 'Acme', description: ['Led 3 launches', '- Cut costs 30%'] },
        { company: 'Beta', description: 'Interned on the data team.', highlights: ['Built 2 dashboards'] },
      ],
      projects: [{ name: 'Engine', description: ['Fast', 'Small'] }],
      skills: [{ category: 'Languages', items: ['Go', 'Python'] }, { name: 'Tools', keywords: 'Docker, Terraform' }, { name: 'Leadership' }, 'Figma', 42],
    });
    expect(result?.experience.map((e) => e.description)).toEqual(['- Led 3 launches\n- Cut costs 30%', 'Interned on the data team.\n- Built 2 dashboards']);
    expect(result?.projects[0].description).toBe('- Fast\n- Small');
    expect(result?.skills).toEqual(['Languages: Go, Python', 'Tools: Docker, Terraform', 'Leadership', 'Figma']);
    expect(sanitizeResumeData({ fullName: 'Pat', skills: 'Python, SQL\nTools: Docker, AWS' })?.skills).toEqual(['Python', 'SQL', 'Tools: Docker, AWS']);
  });
});

describe('dates in imported resumes', () => {
  it('stores month names and full dates as YYYY-MM, and "Present" as a current role', () => {
    const result = sanitizeResumeData({
      fullName: 'Pat',
      experience: [
        { company: 'Acme', startDate: 'Mar 2021', endDate: 'Present' },
        { company: 'Beta', startDate: '2018-06-15', endDate: '2021-02', isCurrent: false },
        { company: 'Gamma', startDate: 'Summer 2016', endDate: '2017' },
      ],
      education: [{ school: 'UCL', startDate: 'Sept 2014', endDate: 'June 2017' }],
    });
    expect(result?.experience).toMatchObject([
      { startDate: '2021-03', endDate: '', isCurrent: true },
      { startDate: '2018-06', endDate: '2021-02', isCurrent: false },
      // Anything else stays as written.
      { startDate: 'Summer 2016', endDate: '2017', isCurrent: false },
    ]);
    expect(result?.education).toMatchObject([{ startDate: '2014-09', endDate: '2017-06' }]);
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
