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

  it('rejects JSON that is not a resume', () => {
    expect(sanitizeResumeData({ foo: 1 })).toBeNull();
    expect(sanitizeResumeData([1, 2])).toBeNull();
  });
});
