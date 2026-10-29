import { MAX_LATEX_SOURCE_CHARS } from '../shared/aiContract';
import type { ResumeData } from '../types';
import { sanitizeResumeData } from './resumeData';

// Client side of "Import LaTeX": trims the .tex before it is sent to the AI parser, and turns the
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
