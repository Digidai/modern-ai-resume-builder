import { describe, expect, it } from 'vitest';
import { DEFAULT_DESIGN } from '../types';
import { latexParseProgress, latexSourceProblem, missingDatedEntries, prepareLatexSource, resumeFromParsedLatex } from './latexImport';
import { sanitizeResumeData } from './resumeData';
import { docxText } from './resumeFile';
import { toDocx } from './docx';
import { toLatex } from './latex';

describe('prepareLatexSource', () => {
  it('drops comments and setup lines but keeps escaped percent signs and macro definitions', () => {
    const tex = [
      '\\documentclass[11pt]{article} % class',
      '\\usepackage{hyperref}',
      '% a full-line comment',
      '\\newcommand{\\resumeItem}[1]{\\item #1}',
      '',
      '',
      '',
      '\\resumeItem{Cut latency 40\\% in Q3} % trailing note',
    ].join('\r\n');
    expect(prepareLatexSource(tex)).toBe('\\newcommand{\\resumeItem}[1]{\\item #1}\n\n\\resumeItem{Cut latency 40\\% in Q3}');
  });

  it('flags sources that are empty, not LaTeX, or too long', () => {
    expect(latexSourceProblem('')).toBe('empty');
    expect(latexSourceProblem('Pat Lee, Software Engineer')).toBe('not-latex');
    expect(latexSourceProblem(`\\section{X}${'a'.repeat(40_001)}`)).toBe('too-long');
    expect(latexSourceProblem('\\section{Experience}')).toBeNull();
  });
});

describe('resumeFromParsedLatex', () => {
  const current = { templateId: 'classic', design: { ...DEFAULT_DESIGN, accent: '#2F5A8A' } };

  it("keeps the user's template and design and fills ids", () => {
    const data = resumeFromParsedLatex(
      JSON.stringify({ fullName: 'Pat Lee', templateId: 'noir', experience: [{ company: 'CMU', role: 'Researcher', startDate: '2021-09', endDate: '', isCurrent: true, description: '- Built X' }] }),
      current
    );
    expect(data).toMatchObject({ fullName: 'Pat Lee', templateId: 'classic', design: { accent: '#2F5A8A' } });
    expect(data?.experience[0].id).toBeTruthy();
  });

  it('accepts bullets as an array and moves a LinkedIn link into its own field', () => {
    const data = resumeFromParsedLatex(
      JSON.stringify({
        fullName: '王小明',
        links: [{ label: 'LinkedIn', url: 'https://linkedin.com/in/wxm' }, { label: 'GitHub', url: 'https://github.com/wxm' }],
        experience: [{ company: '字节跳动', role: '工程师', description: ['- 负责推荐服务重构', '设计多活方案', ''] }],
      }),
      current
    );
    expect(data?.experience[0].description).toBe('- 负责推荐服务重构\n- 设计多活方案');
    expect(data?.linkedin).toBe('https://linkedin.com/in/wxm');
    expect(data?.links.map((link) => link.url)).toEqual(['https://github.com/wxm']);
  });

  it('rejects replies that are not a resume', () => {
    expect(resumeFromParsedLatex('not json', current)).toBeNull();
    expect(resumeFromParsedLatex('[]', current)).toBeNull();
    expect(resumeFromParsedLatex('{"summary":""}', current)).toBeNull();
  });
});

describe('latexParseProgress', () => {
  it('counts entries per list and names the list being written, ignoring braces and keys inside strings', () => {
    const partial =
      '{"fullName":"A \\"{experience}\\" B","summary":"[skills] {x}","experience":[{"company":"X","description":"- {a} [b]"},{"company":"Y"}],' +
      '"skills":["Python, R","SQL"],"publications":[{"title":"On {graphs}"},{"title":"Unfinished \\"quo';
    expect(latexParseProgress(partial)).toEqual({ section: 'publications', counts: { experience: 2, skills: 2, publications: 2 } });
    expect(latexParseProgress('{"fullName":"Pat","education":[]').section).toBeNull();
  });
});

describe('missingDatedEntries', () => {
  const pat = sanitizeResumeData({
    fullName: 'Pat Lee',
    summary: 'Placed 38,000 cubic yards across 9 projects in 2024–2025.',
    experience: [
      { company: 'Keystone', role: 'Foreman', startDate: '2019-05', isCurrent: true, description: '- Raised ratings each year from 2021 to 2025' },
      { company: 'Buckeye', role: 'Finisher', startDate: '2014-03', endDate: '2019-04' },
    ],
    education: [{ school: 'Ohio State', degree: 'BS', startDate: '2010-09', endDate: '2014-05' }],
  })!;

  it('counts dated entry headings the parse has no entry for, in Word text and LaTeX', async () => {
    const text = await docxText(toDocx(pat));
    const tex = prepareLatexSource(toLatex(pat));
    expect(missingDatedEntries(text, pat)).toBe(0);
    expect(missingDatedEntries(tex, pat)).toBe(0);
    const skipped = { ...pat, experience: pat.experience.slice(0, 1) };
    expect(missingDatedEntries(text, skipped)).toBe(1);
    expect(missingDatedEntries(tex, skipped)).toBe(1);
  });

  it('reads CJK and numeric dates, and ignores periods inside sentences and bullets', () => {
    const one = { ...pat, experience: [], education: pat.education };
    expect(missingDatedEntries('字节跳动 前端负责人 2020.03 – 至今\n浙江大学 2012年9月 – 2016年6月', one)).toBe(1);
    expect(missingDatedEntries('Acme, Engineer 03/2019 - 04/2021\nOhio State, BS 2010 – 2014', one)).toBe(1);
    expect(missingDatedEntries('Grew sales 30% in 2023–2025\n- Led the team from 2021 to 2024\nOhio State, BS 2010 – 2014', one)).toBe(0);
  });
});
