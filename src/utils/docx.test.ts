import { describe, expect, it } from 'vitest';
import { toDocx } from './docx';
import { docxText } from './resumeFile';
import { INITIAL_RESUME_DATA } from '../types';

describe('toDocx', () => {
  it('writes a Word file the importer reads back: headings, bullets, dates, links and escaped text', async () => {
    const data = { ...INITIAL_RESUME_DATA, fullName: 'Pat <Lee> & Co', summary: 'Builds 简历 tools.' };
    const text = await docxText(toDocx(data));
    const lines = text.split('\n');
    expect(lines[0]).toBe('Pat <Lee> & Co');
    expect(text).toContain('Builds 简历 tools.');
    expect(text).toContain('- Led the company-wide design system, cutting UI development time by 30%');
    expect(text).toContain('Senior Product Designer, TechNova Solutions Mar 2021 – Present');
    expect(lines.indexOf('Experience')).toBeLessThan(lines.indexOf('Education'));
    // Stored (uncompressed) zip, so the hyperlink targets are readable in the bytes.
    const raw = new TextDecoder().decode(toDocx(data));
    expect(raw).toContain('Target="https://www.alexsterling.design" TargetMode="External"');
    expect(raw).toContain('Target="mailto:alex.sterling@example.com" TargetMode="External"');
  });
});
