import { describe, expect, it } from 'vitest';
import { toDocx } from './docx';
import { docxText } from './resumeFile';
import { DEFAULT_DESIGN, INITIAL_RESUME_DATA } from '../types';

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

  it('writes headings and dates in Chinese when the resume language is Chinese', async () => {
    const text = await docxText(toDocx({ ...INITIAL_RESUME_DATA, design: { ...DEFAULT_DESIGN, language: 'zh' } }));
    const lines = text.split('\n');
    expect(lines).toContain('工作经历');
    expect(lines).toContain('教育背景');
    expect(text).toContain('Senior Product Designer, TechNova Solutions 2021.03 – 至今');
    expect(lines).not.toContain('Experience');
    const ja = await docxText(toDocx({ ...INITIAL_RESUME_DATA, design: { ...DEFAULT_DESIGN, language: 'ja' } }));
    expect(ja.split('\n')).toContain('職務経歴');
    expect(ja).toContain('2021年3月 – 現在');
    // Word draws CJK text in the eastAsia font: YaHei has no Hangul and draws kanji the Chinese way.
    const styles = (language: 'ja' | 'ko') => new TextDecoder().decode(toDocx({ ...INITIAL_RESUME_DATA, design: { ...DEFAULT_DESIGN, language } }));
    expect(styles('ja')).toContain('w:eastAsia="Yu Gothic"');
    expect(styles('ja')).toContain('w:eastAsia="ja-JP"');
    expect(styles('ko')).toContain('w:eastAsia="Malgun Gothic"');
  });
});
