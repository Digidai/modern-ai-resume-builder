import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { docxPhoto, docxText, looksLikeLatex, tidyResumeText } from './resumeFile';

describe('docxText', () => {
  it('reads paragraphs, list items as bullets and link URLs from a Word file', async () => {
    const text = await docxText(new Uint8Array(readFileSync('src/test/fixtures/resume.docx')));
    expect(text.split('\n')[0]).toBe('Maria Chen');
    expect(text).toContain('- Led the redesign of the savings flow, lifting pot creation by 18%.');
    expect(text).toContain('Senior Product Designer, Monzo — London | Mar 2022 – Present');
    expect(text).toMatch(/Links in the file:\nhttps:\/\/mariachen\.design\/?\nhttps:\/\/www\.linkedin\.com\/in\/mariachen/);
  });
});

describe('docxPhoto', () => {
  it('returns the headshot picture of a Word file', async () => {
    const photo = await docxPhoto(new Uint8Array(readFileSync('src/test/fixtures/resume.docx')));
    expect(photo?.type).toBe('image/jpeg');
    expect(photo?.size).toBe(12964);
  });
});

describe('looksLikeLatex', () => {
  it('tells a .tex source from resume text that mentions a backslash', () => {
    expect(looksLikeLatex('\\documentclass{moderncv}\n\\name{Pat}{Lee}')).toBe(true);
    expect(looksLikeLatex('Pat Lee\nC:\\Users\\pat · built tools in C\\C++')).toBe(false);
  });
});

describe('tidyResumeText', () => {
  it('closes up letter-spaced headings but keeps their words apart', () => {
    expect(tidyResumeText('S O F T W A R E  E N G I N E E R\nS K I L L S\nGo,  Python and C')).toBe('SOFTWARE ENGINEER\nSKILLS\nGo, Python and C');
  });
});
