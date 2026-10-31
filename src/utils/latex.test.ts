import { describe, expect, it } from 'vitest';
import { INITIAL_RESUME_DATA } from '../types';
import { escapeLatex, latexEngine, toLatex } from './latex';

describe('escapeLatex', () => {
  it('escapes every special character so the text compiles verbatim', () => {
    expect(escapeLatex('50% & #1 in_region ~ $2M {x} \\ a^2 – —')).toBe(
      '50\\% \\& \\#1 in\\_region \\textasciitilde{} \\$2M \\{x\\} \\textbackslash{} a\\textasciicircum{}2 -- ---'
    );
  });
});

describe('toLatex', () => {
  const data = {
    ...INITIAL_RESUME_DATA,
    fullName: 'Pat Lee',
    publications: [{ id: '1', authors: 'Lee, C., Lee, P., Chen, J.', title: 'Sparse attention', venue: 'NeurIPS', year: '2025', link: 'doi.org/10.1/x_y' }],
    talks: [{ id: 't', title: 'Long documents', event: 'ICML', location: '', year: '2024' }],
  };

  it('bolds only the owner in author lists and puts academic sections after education', () => {
    const tex = toLatex(data);
    expect(tex).toContain('\\item Lee, C., \\textbf{Lee, P.}, Chen, J. (2025). Sparse attention. \\textit{NeurIPS}. \\href{https://doi.org/10.1/x_y}{doi.org/10.1/x\\_y}');
    const order = ['\\section{Education}', '\\section{Publications}', '\\section{Talks}', '\\section{Experience}'].map((s) => tex.indexOf(s));
    expect(order.every((index, i) => index > 0 && (i === 0 || index > order[i - 1]))).toBe(true);
    expect(tex.trim().endsWith('\\end{document}')).toBe(true);
  });

  it('sets the LaTeX paper size from the design', () => {
    expect(toLatex(data)).toContain('\\documentclass[11pt,a4paper]{article}');
    expect(toLatex({ ...data, design: { ...data.design, paper: 'letter' } })).toContain('\\usepackage[letterpaper,margin=18mm]{geometry}');
  });

  it('keeps hours per week from federal resumes on the role line', () => {
    const [first, ...rest] = data.experience;
    const tex = toLatex({ ...data, experience: [{ ...first, hours: '40' }, ...rest] });
    expect(tex).toContain('{Senior Product Designer, 40 hours per week}');
    expect(tex).toContain('{UI/UX Designer}');
  });

  it('picks XeLaTeX only when the resume has CJK text', () => {
    expect(latexEngine(data)).toBe('pdflatex');
    expect(latexEngine({ ...data, summary: '负责搜索排序' })).toBe('xelatex');
    expect(toLatex({ ...data, summary: '负责搜索排序' })).toContain('\\usepackage{xeCJK}');
  });

  it('switches to XeLaTeX for characters pdfLaTeX cannot set, and keeps edge cases compilable', () => {
    expect(latexEngine({ ...data, summary: 'Café, naïve – “quoted” …' })).toBe('pdflatex');
    expect(latexEngine({ ...data, summary: 'Shipped → 🚀' })).toBe('xelatex');
    expect(latexEngine({ ...data, summary: 'Ελληνικά' })).toBe('xelatex');
    const tex = toLatex({ ...data, fullName: 'Pat\n\\documentclass Lee', summary: 'Lead\u200Bership\n- [Beta] shipped X' });
    expect(tex.split('\n')[0]).toBe('% Pat \\documentclass Lee, exported from ModernCV (https://genedai.cv).');
    expect(tex).toContain('Leadership');
    expect(tex).toContain('\\item{} [Beta] shipped X');
  });
});
