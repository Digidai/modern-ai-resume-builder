import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AwardLine, Authors, TalkLine, TeachingLine, displayUrl, formatDateRange, groupSkills, resumeLanguage, toHref } from './shared';
import { DEFAULT_DESIGN, INITIAL_RESUME_DATA } from '../../types';

describe('groupSkills', () => {
  it('splits a category on top-level separators but keeps commas inside parentheses', () => {
    expect(groupSkills(['Cloud: AWS (ECS, Lambda, S3), GCP; Terraform', 'Figma'])).toEqual([
      { category: 'Cloud', items: ['AWS (ECS, Lambda, S3)', 'GCP', 'Terraform'] },
      { category: '', items: ['Figma'] },
    ]);
  });
});

describe('displayUrl and toHref', () => {
  it('drop the tracking parameters share buttons add, and keep the ones a page needs', () => {
    const shared = 'https://www.linkedin.com/in/pat-lee/?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app';
    expect(displayUrl(shared)).toBe('www.linkedin.com/in/pat-lee');
    expect(toHref(shared)).toBe('https://www.linkedin.com/in/pat-lee/');
    expect(displayUrl('instagram.com/pat.lee?igsh=MXZ2bnd0')).toBe('instagram.com/pat.lee');
    expect(toHref('youtu.be/dQw4w9WgXcQ?si=Ab12&t=42')).toBe('https://youtu.be/dQw4w9WgXcQ?t=42');
    expect(displayUrl('youtube.com/watch?v=dQw4w9WgXcQ&si=Ab12')).toBe('youtube.com/watch?v=dQw4w9WgXcQ');
    expect(displayUrl('x.com/patlee?s=21&t=Zx9')).toBe('x.com/patlee');
    // "t" and "si" are only tracking on those sites.
    expect(displayUrl('pat.dev/talk?t=3&si=1#demo')).toBe('pat.dev/talk?t=3&si=1#demo');
    expect(displayUrl('https://pat.dev/')).toBe('pat.dev');
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

describe('resumeLanguage', () => {
  const resume = (patch: Partial<typeof INITIAL_RESUME_DATA>) => ({ ...INITIAL_RESUME_DATA, experience: [], education: [], projects: [], skills: [], ...patch });

  it('tells Chinese, Japanese and Korean content apart, even with English tool names, but not from a CJK name', () => {
    expect(resumeLanguage(resume({ title: '高级前端工程师', summary: '负责 React、TypeScript 与 Node.js 服务的架构设计，带领 5 人团队交付 Design System。' }))).toBe('zh');
    expect(resumeLanguage(resume({ fullName: '李明', title: 'Senior Engineer', summary: 'Builds data platforms with Spark and Kafka.' }))).toBe('en');
    expect(resumeLanguage(resume({ title: 'フロントエンドエンジニア', summary: '大規模なウェブサービスの開発を担当しました。' }))).toBe('ja');
    // Mostly kanji with a few particles is still Japanese; Korean is Hangul even with English names.
    expect(resumeLanguage(resume({ title: '営業部長', summary: '法人営業部門統括責任者として新規顧客開拓を推進。' }))).toBe('ja');
    expect(resumeLanguage(resume({ title: '백엔드 개발자', summary: 'Kotlin과 Spring 기반 결제 시스템을 설계하고 운영했습니다.' }))).toBe('ko');
    expect(resumeLanguage(resume({ title: 'Engineer', skills: ['熟悉 Go'] }))).toBe('en');
  });

  it('follows the design setting over the content', () => {
    expect(resumeLanguage(resume({ summary: '负责产品规划与用户研究工作。', design: { ...DEFAULT_DESIGN, language: 'en' } }))).toBe('en');
    expect(resumeLanguage(resume({ summary: 'Product planning.', design: { ...DEFAULT_DESIGN, language: 'zh' } }))).toBe('zh');
  });

  it('formats dates the way each language writes them', () => {
    expect(formatDateRange('2021-3', '', true, 'zh')).toBe('2021.03 – 至今');
    expect(formatDateRange('2019-09', '2023-06', false, 'zh')).toBe('2019.09 – 2023.06');
    expect(formatDateRange('2021-03', '', true)).toBe('Mar 2021 – Present');
    expect(formatDateRange('2021-03', '', true, 'ja')).toBe('2021年3月 – 現在');
    expect(formatDateRange('2018-07', '2021-02', false, 'ko')).toBe('2018.07 – 2021.02');
    expect(formatDateRange('2021-03', '', true, 'ko')).toBe('2021.03 – 현재');
  });
});

describe('Templates', () => {
  // Chrome's PDFs place letter-spaced glyphs one by one; past about 0.1em, text extraction (pdftotext,
  // which ATS parsers resemble) reads "E D U C AT I O N" and misses the heading.
  it('keep letter-spacing at or below 0.08em so ATS parsers read PDF text as words', async () => {
    const { TEMPLATES } = await import('../../constants/templates');
    const { TEMPLATE_LOADERS } = await import('../ResumeTemplateRenderer');
    const { FIXTURES } = await import('../../dev/fixtures');
    const wide: string[] = [];
    for (const template of TEMPLATES) {
      const { default: Template } = await TEMPLATE_LOADERS[template.id as keyof typeof TEMPLATE_LOADERS]();
      const html = renderToStaticMarkup(createElement(Template, { data: { ...FIXTURES.default, templateId: template.id } }));
      for (const [cls, value] of html.matchAll(/tracking-\[([\d.]+)em\]|tracking-widest/g)) if (!value || Number(value) > 0.08) wide.push(`${template.id}: ${cls}`);
    }
    expect(wide).toEqual([]);
  });

  it('print every heading, contact label and date in Chinese, Japanese or Korean for such a resume', async () => {
    const { TEMPLATES } = await import('../../constants/templates');
    const { TEMPLATE_LOADERS } = await import('../ResumeTemplateRenderer');
    const { FIXTURES } = await import('../../dev/fixtures');
    const headings = { zh: ['工作经历', '教育背景'], ja: ['職務経歴', '学歴'], ko: ['경력', '학력'] } as const;
    const english: string[] = [];
    for (const template of TEMPLATES) {
      const { default: Template } = await TEMPLATE_LOADERS[template.id as keyof typeof TEMPLATE_LOADERS]();
      for (const language of ['zh', 'ja', 'ko'] as const) {
        const data = { ...FIXTURES.long, templateId: template.id, design: { ...DEFAULT_DESIGN, language } };
        const html = renderToStaticMarkup(createElement(Template, { data }));
        const text = html.replace(/<[^>]+>/g, '');
        if (!headings[language].every((heading) => text.includes(heading))) english.push(`${template.id} (${language}): no translated headings`);
        for (const match of html.matchAll(/>\s*(Summary|Profile|Experience|Work Experience|Education|Skills|Projects|Contact|Email|Phone|Location|Present|Jan \d{4}|Mar \d{4})\s*</gi)) {
          // Mono writes code: "const skills = [...]" keeps its variable names.
          if (!html.slice(match.index - 60, match.index).includes('>const<')) english.push(`${template.id} (${language}): ${match[1]}`);
        }
      }
    }
    expect(english).toEqual([]);
  });
});
