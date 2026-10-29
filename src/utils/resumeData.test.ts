import { describe, expect, it } from 'vitest';
import { sanitizeResumeData } from './resumeData';

describe('sanitizeResumeData', () => {
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

  it('keeps only inline raster photos, including a JSON Resume basics.image', () => {
    const jpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
    expect(sanitizeResumeData({ fullName: 'Pat', photo: jpeg })?.photo).toBe(jpeg);
    expect(sanitizeResumeData({ basics: { name: 'Pat', image: jpeg } })?.photo).toBe(jpeg);
    // Remote URLs would load from the network when the PDF renders; SVG can carry scripts.
    expect(sanitizeResumeData({ fullName: 'Pat', photo: 'https://example.com/me.jpg' })?.photo).toBeUndefined();
    expect(sanitizeResumeData({ fullName: 'Pat', photo: 'data:image/svg+xml;base64,PHN2Zz4=' })?.photo).toBeUndefined();
    expect(sanitizeResumeData({ fullName: 'Pat', photo: `data:image/png;base64,${'A'.repeat(200_000)}` })?.photo).toBeUndefined();
  });

  it('rejects JSON that is not a resume', () => {
    expect(sanitizeResumeData({ foo: 1 })).toBeNull();
    expect(sanitizeResumeData([1, 2])).toBeNull();
  });
});
