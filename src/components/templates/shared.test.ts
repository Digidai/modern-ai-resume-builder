import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AwardLine, Authors, TalkLine, TeachingLine, groupSkills } from './shared';

describe('groupSkills', () => {
  it('splits a category on top-level separators but keeps commas inside parentheses', () => {
    expect(groupSkills(['Cloud: AWS (ECS, Lambda, S3), GCP; Terraform', 'Figma'])).toEqual([
      { category: 'Cloud', items: ['AWS (ECS, Lambda, S3)', 'GCP', 'Terraform'] },
      { category: '', items: ['Figma'] },
    ]);
  });
});

describe('Authors', () => {
  const bolded = (authors: string, owner: string) =>
    Array.from(renderToStaticMarkup(createElement(Authors, { authors, owner })).matchAll(/<strong[^>]*>(.*?)<\/strong>/g), (m) => m[1]);

  it('bolds only the owner, in any common name format', () => {
    // A coauthor with the same surname but another initial stays plain.
    expect(bolded('Lee, C., Lee, P., Patel, K.', 'Pat Lee')).toEqual(['Lee, P.']);
    expect(bolded('Chen J, P. Lee, Okafor N', 'Pat Lee')).toEqual(['P. Lee']);
    expect(bolded('Pat Lee and Jun Chen', 'pat lee')).toEqual(['Pat Lee']);
    expect(bolded('Chen, J., Okafor, N.', 'Pat Lee')).toEqual([]);
  });
});

describe('TalkLine, AwardLine and TeachingLine', () => {
  const text = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el).replace(/<[^>]+>/g, '').replace(/&quot;/g, '"');

  it('punctuates talks once, whichever fields are filled', () => {
    expect(text(createElement(TalkLine, { talk: { id: '1', title: 'Sparse attention.', event: 'NeurIPS', location: 'Vancouver', year: '2025' } }))).toBe('“Sparse attention.” NeurIPS, Vancouver, 2025.');
    expect(text(createElement(TalkLine, { talk: { id: '1', title: 'Why sparse?', event: 'Seminar', location: '', year: '2024' }, showYear: false }))).toBe('“Why sparse?” Seminar.');
    expect(text(createElement(TalkLine, { talk: { id: '1', title: 'Untitled', event: '', location: '', year: '' } }))).toBe('“Untitled.”');
  });

  it('joins award parts and leaves the year to the gutter when asked', () => {
    const award = { id: '1', title: 'Fellowship', issuer: 'NSF', year: '2023', detail: '' };
    expect(text(createElement(AwardLine, { award }))).toBe('Fellowship, NSF, 2023.');
    expect(text(createElement(AwardLine, { award, showYear: false }))).toBe('Fellowship, NSF.');
    const entry = { id: '1', course: 'CS 229', role: 'Teaching Assistant', institution: '', year: '2024' };
    expect(text(createElement(TeachingLine, { entry }))).toBe('CS 229, Teaching Assistant, 2024.');
    expect(text(createElement(TeachingLine, { entry, showYear: false }))).toBe('CS 229, Teaching Assistant.');
  });
});
