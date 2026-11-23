import { MAX_LATEX_SOURCE_CHARS } from '../shared/aiContract';
import type { ResumeData } from '../types';
import { sanitizeResumeData } from './resumeData';

// Client side of Import resume for LaTeX (and of its JSON reply for any source): trims the .tex before it is sent to the AI parser, and turns the
// parser's JSON reply into a resume.

/** Package, class and colour setup that says nothing about the resume. */
const SETUP_LINE = /^\s*\\(?:documentclass|usepackage|RequirePackage|definecolor|colorlet|hypersetup|geometry|pagestyle|thispagestyle|setlength|addtolength|urlstyle|raggedbottom|raggedright|pdfgentounicode|input\{glyphtounicode\})\b.*$/;

/** Drops comments, setup lines and blank runs; custom macro definitions stay, since they say what each argument means. */
export const prepareLatexSource = (source: string): string =>
  source
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/(^|[^\\])%.*$/, '$1').trimEnd())
    .filter((line) => !SETUP_LINE.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

export type LatexSourceProblem = 'empty' | 'not-latex' | 'too-long';

/** Why a prepared source can't be sent, or null when it can. */
export const latexSourceProblem = (prepared: string): LatexSourceProblem | null => {
  if (!prepared) return 'empty';
  if (!/\\[A-Za-z]+/.test(prepared)) return 'not-latex';
  if (prepared.length > MAX_LATEX_SOURCE_CHARS) return 'too-long';
  return null;
};

const MONTH = '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?';
const DATE = `(?:(?:${MONTH}\\s+)?(?:19|20)\\d{2}(?:[./-]\\d{1,2})?|\\d{1,2}/(?:19|20)\\d{2}|(?:19|20)\\d{2}年(?:\\d{1,2}月)?|(?:19|20)\\d{2}\\.\\d{2})`;
const DATE_RANGE = new RegExp(`${DATE}\\s*(?:–|—|-{1,3}|\\bto\\b|~|～|至|\\\\textendash|\\$-\\$)\\s*(?:${DATE}|present|current|now|today|至今|现在|現在|현재)`, 'i');

/**
 * How many dated lines of the source ("Aug 2017 – Mar 2021", "2012.09 – 2016.06") have no job, degree or
 * other dated entry in the parsed resume. The parser now and then skips a whole entry; a resume gives
 * nearly every job and degree its own date range, so more ranges than entries means one is likely missing.
 */
export const missingDatedEntries = (source: string, parsed: ResumeData): number => {
  // Entry headings only: not bullets or long summary lines, and not a period named in a sentence ("in 2024–2025").
  const ranges = source.split('\n').filter((line) => {
    const text = line.trim();
    if (text.length > 160 || /^(?:[-•▪*·]|\d+\.|\\item\b)/.test(text)) return false;
    const at = text.search(DATE_RANGE);
    return at !== -1 && !/\b(?:in|from|between|during|since|of)\s+$/i.test(text.slice(0, at));
  }).length;
  const entries = parsed.experience.length + parsed.education.length + (parsed.awards?.length ?? 0) + (parsed.teaching?.length ?? 0);
  return Math.max(0, ranges - entries);
};

/** The parser's JSON reply as a resume, keeping the user's template and design; null when it holds no resume. */
export const resumeFromParsedLatex = (json: string, current: Pick<ResumeData, 'templateId' | 'design'>): ResumeData | null => {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const input = raw as Record<string, unknown>;
  // Models sometimes return bullets as an array; the resume keeps one "- " line per bullet.
  const bullets = (entry: unknown) => {
    if (!entry || typeof entry !== 'object' || !Array.isArray((entry as { description?: unknown }).description)) return entry;
    const lines = ((entry as { description: unknown[] }).description).filter((line): line is string => typeof line === 'string' && line.trim() !== '');
    return { ...entry, description: lines.map((line) => (/^\s*[-*•]\s/.test(line) ? line.trim() : `- ${line.trim()}`)).join('\n') };
  };
  const links = Array.isArray(input.links) ? (input.links as Array<{ url?: unknown }>) : [];
  const linkedin = typeof input.linkedin === 'string' && input.linkedin ? null : links.find((link) => typeof link?.url === 'string' && /linkedin\.com\//i.test(link.url));
  const data = sanitizeResumeData({
    ...input,
    experience: Array.isArray(input.experience) ? input.experience.map(bullets) : input.experience,
    projects: Array.isArray(input.projects) ? input.projects.map(bullets) : input.projects,
    ...(linkedin ? { linkedin: linkedin.url, links: links.filter((link) => link !== linkedin) } : {}),
    templateId: current.templateId,
    design: current.design,
  });
  if (!data) return null;
  const hasContent = data.fullName || data.experience.length || data.education.length || (data.publications ?? []).length;
  return hasContent ? data : null;
};

const PROGRESS_SECTIONS = ['experience', 'education', 'projects', 'publications', 'awards', 'talks', 'teaching', 'skills'] as const;
export type LatexProgressSection = (typeof PROGRESS_SECTIONS)[number];

/**
 * Reads the parser's partial JSON as it streams in: which list it is writing now and how many entries
 * each list has so far. Tolerates a reply cut off anywhere, including mid-string.
 */
export const latexParseProgress = (partial: string): { section: LatexProgressSection | null; counts: Partial<Record<LatexProgressSection, number>> } => {
  const counts: Partial<Record<LatexProgressSection, number>> = {};
  let section: LatexProgressSection | null = null;
  let depth = 0;
  let inString = false;
  let stringStart = 0;
  let lastString = '';
  let key = '';
  for (let i = 0; i < partial.length; i += 1) {
    const char = partial[i];
    if (inString) {
      if (char === '\\') i += 1;
      else if (char === '"') {
        inString = false;
        lastString = partial.slice(stringStart, i);
        // A string inside a top-level list of strings (skills) is one entry.
        if (depth === 2 && section === 'skills' && key === 'skills') counts.skills = (counts.skills ?? 0) + 1;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
      stringStart = i + 1;
    } else if (char === ':' && depth === 1) key = lastString;
    else if (char === '{' || char === '[') {
      depth += 1;
      if (char === '[' && depth === 2) section = (PROGRESS_SECTIONS as readonly string[]).includes(key) ? (key as LatexProgressSection) : null;
      if (char === '{' && depth === 3 && section && key === section) counts[section] = (counts[section] ?? 0) + 1;
    } else if (char === '}' || char === ']') {
      depth -= 1;
      if (depth === 1) section = null;
    }
  }
  return { section, counts };
};
