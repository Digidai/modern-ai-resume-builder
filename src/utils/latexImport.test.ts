import { describe, expect, it } from 'vitest';
import { DEFAULT_DESIGN } from '../types';
import { latexSourceProblem, prepareLatexSource, resumeFromParsedLatex } from './latexImport';

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
