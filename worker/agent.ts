// Agent mode: the same capabilities over a remote MCP server (`/mcp`, Streamable HTTP, stateless)
// and a plain HTTP API (`/api/agent/*`) for agents that use skills or function calling instead.
// No accounts or keys: requests are anonymous, rate limited per IP, and never stored. Resumes sent
// for rendering live only for the duration of the request. A PDF download link carries the resume
// itself, encrypted, and renders it again when opened.

import puppeteer from '@cloudflare/puppeteer';
import { TEMPLATES, currentTemplateId, getTemplateById, showsAwards } from '../src/constants/templates';
import { FONT_PRESETS } from '../src/constants/design';
import { MM_TO_PX, paperSize } from '../src/constants/print';
import { sanitizeResumeData } from '../src/utils/resumeData';
import { encodeResumePayload } from '../src/shared/resumeLink';
import { buildRoleGuide } from '../src/shared/roleGuide.mjs';
import roleGuides from '../src/data/roleGuides.json';
import jobTitles from '../src/data/jobTitles.json';
import type { ResumeData } from '../src/types';
import { slugifyJobTitle } from '../src/utils/slug';
import { validateUrl } from '../src/utils/validation';
import { latexEngine, toLatex } from '../src/utils/latex';
import { PUBLICATION_KINDS, parseBibtex, type ImportedPublication, type PublicationKind } from '../src/utils/bibtex';
import { OrcidError, fetchOrcidPublications, normalizeOrcid } from './orcid';

export interface AgentEnv {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  BROWSER?: Parameters<typeof puppeteer.launch>[0];
  /** Origin the headless browser loads `/render/` from; defaults to the request's origin. */
  RENDER_ORIGIN?: string;
  /** Also keys the encryption of PDF download links (see pdfDownloadLink). */
  AI_SIGNING_SECRET?: string;
}

export interface AgentDeps {
  /** Consumes one unit from a per-minute bucket; false when the limit is reached. */
  rateLimit: (key: string, limit: number) => Promise<boolean>;
  clientIp: string;
}

export const MCP_PATH = '/mcp';
export const AGENT_API_PREFIX = '/api/agent/';

const SERVER_VERSION = '1.0.0';
const MCP_PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const MAX_AGENT_BODY_BYTES = 256 * 1024;
const MAX_RPC_BATCH = 10;
const RENDER_TIMEOUT_MS = 45000;
const DOWNLOAD_PATH = 'download/';
const DOWNLOAD_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Longer links (big academic CVs) fall back to an embedded PDF; Cloudflare rejects URLs over 16 KB. */
const MAX_DOWNLOAD_URL_CHARS = 12000;
// Hosted agents (claude.ai and ChatGPT connectors, cloud agents) reach us from a few shared egress IPs, so
// the per-IP limits are generous and the global render budget is what bounds cost.
const LIMITS = { requestsPerIp: 120, rendersPerIp: 20, rendersGlobal: 60, orcidPerIp: 20, orcidGlobal: 30 };
const FONT_IDS: string[] = FONT_PRESETS.map((f) => f.id);

class AgentError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
  }
}

type Json = Record<string, unknown>;

// ---------------------------------------------------------------------------------------------
// Core capabilities (shared by MCP tools and the HTTP API)
// ---------------------------------------------------------------------------------------------

const listTemplates = (origin: string, atsOnly = false) =>
  TEMPLATES.filter((t) => !atsOnly || t.atsFriendly).map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    bestFor: t.bestFor,
    atsFriendly: t.atsFriendly,
    photo: Boolean(t.photo),
    publications: Boolean(t.publications),
    hours: Boolean(t.hours),
    awards: showsAwards(t),
    ...(t.maxPages ? { maxPages: t.maxPages } : {}),
    preview: `${origin}/og/templates/${t.id}-page.jpg`,
    page: `${origin}/templates/${t.id}/`,
  }));

const categoryByTitle = new Map<string, string>();
for (const category of jobTitles as { name: string; titles: string[] }[]) {
  for (const title of category.titles) categoryByTitle.set(title.toLowerCase(), category.name);
}
/** Directory titles keyed by a loose form: no parentheticals, punctuation or extra spaces ("Registered Nurse (RN)" → "registered nurse"). */
const ABBREVIATIONS: Record<string, string> = { sr: 'senior', jr: 'junior', mgr: 'manager', eng: 'engineer', dev: 'developer', vp: 'vp' };
const looseKey = (title: string) =>
  title
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(front|back)[\s-]+end\b/g, '$1end')
    .replace(/[^a-z0-9+#]+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => ABBREVIATIONS[w] ?? w)
    .join(' ');
/** Generic one-word requests that mean a specific directory title. */
const GENERIC_TITLES: Record<string, string> = { nurse: 'Registered Nurse (RN)' };
const titleByLoose = new Map<string, string>();
for (const category of jobTitles as { name: string; titles: string[] }[]) {
  for (const title of category.titles) {
    titleByLoose.set(title.toLowerCase(), title);
    if (!titleByLoose.has(looseKey(title))) titleByLoose.set(looseKey(title), title);
    // Acronyms in parentheses also match on their own ("RN", "LPN").
    for (const m of title.matchAll(/\(([^)]+)\)/g)) if (!titleByLoose.has(m[1].toLowerCase())) titleByLoose.set(m[1].toLowerCase(), title);
  }
}

/** The directory title a request most likely means, or undefined. */
const resolveTitle = (title: string): string | undefined => {
  const lower = title.toLowerCase().trim();
  const loose = looseKey(title);
  const direct = titleByLoose.get(lower) ?? titleByLoose.get(loose) ?? (GENERIC_TITLES[loose] && titleByLoose.get(GENERIC_TITLES[loose].toLowerCase()));
  if (direct) return direct;
  // Longest known title inside the request ("Senior Data Analyst II" → "Senior Data Analyst").
  let best: string | undefined;
  for (const [key, known] of titleByLoose) {
    if (key.length > 2 && (` ${loose} `).includes(` ${key} `) && key.length > (best ? looseKey(best).length : 0)) best = known;
  }
  if (best) return best;
  // Shortest known title containing every word of the request ("nurse" → "Registered Nurse (RN)" is not shortest; prefer titles that start with it).
  const words = loose.split(' ').filter(Boolean);
  if (!words.length) return undefined;
  const hits = [...new Set(titleByLoose.values())].filter((t) => words.every((w) => ` ${looseKey(t)} `.includes(` ${w} `)));
  hits.sort((a, b) => looseKey(a).length - looseKey(b).length);
  return hits[0];
};

/** Best-effort job family for titles outside the directory ("Senior Backend Engineer II"). */
const guessCategory = (title: string): string | undefined => {
  const resolved = resolveTitle(title);
  return resolved ? categoryByTitle.get(resolved.toLowerCase()) : undefined;
};

const getExampleResume = async (env: AgentEnv, origin: string, jobTitle: string) => {
  const title = jobTitle.trim().slice(0, 120);
  if (!title) throw new AgentError(400, 'INVALID_REQUEST', 'job_title is required.');
  // Exact title first, then the longest known title contained in the request ("Senior Data Analyst II").
  const resolved = resolveTitle(title);
  const candidates = [...new Set([title, ...(resolved ? [resolved] : [])])];
  for (const candidate of candidates) {
    const response = await env.ASSETS.fetch(new Request(`${origin}/examples/${slugifyJobTitle(candidate)}.json`));
    if (response.ok && (response.headers.get('content-type') ?? '').includes('json')) {
      const data = (await response.json()) as Json;
      return { ...data, matchedTitle: data.jobTitle, exact: String(data.jobTitle).toLowerCase() === title.toLowerCase() };
    }
  }
  throw new AgentError(404, 'NOT_FOUND', `No example for "${title}". Use get_writing_guide (GET /api/agent/guide) instead, or try a more common job title such as "Program Analyst".`);
};

const FEDERAL_TITLE = /\b(federal|usajobs|gs-?\d{1,2})\b/i;
const FEDERAL_GUIDE = {
  template: 'federal',
  paper: 'letter',
  maxPages: 2,
  rules: [
    'Hours per week on every job: experience[].hours, e.g. "40".',
    'Series and grade in the job title, e.g. "Program Analyst, GS-0343-12".',
    'Dates as YYYY-MM; the federal template prints them as MM/YYYY.',
    'Certifications as a skills group "Certifications: PMP, PMI, 2022; CISSP, ISC2, 2024" and a clearance as "Security Clearance: Secret, active".',
    'Awards in awards[] (shown as Honors and Awards).',
  ],
};

const getWritingGuide = (jobTitle: string) => {
  const title = jobTitle.trim().slice(0, 120);
  if (!title) throw new AgentError(400, 'INVALID_REQUEST', 'job_title is required.');
  const matched = resolveTitle(title);
  const category = guessCategory(title);
  const guide = buildRoleGuide({ title, category, data: roleGuides, templates: TEMPLATES });
  // US federal jobs (USAJOBS) have their own format: the federal template, Letter, up to 2 pages.
  const federal = FEDERAL_TITLE.test(title);
  if (federal) {
    guide.length = 'Up to 2 pages on US Letter: USAJOBS may not consider longer federal resumes.';
    const fed = TEMPLATES.find((t) => t.id === 'federal');
    if (fed) guide.recommended = [fed, ...guide.recommended.filter((t) => t.id !== 'federal')];
  } else if (category === 'Government & Public Service') {
    guide.length += ' For US federal jobs on USAJOBS, use the "federal" template on paper "letter", up to 2 pages.';
  }
  return {
    jobTitle: title,
    matchedTitle: matched ?? null,
    exact: !!matched && matched.toLowerCase() === title.toLowerCase(),
    jobFamily: category ?? 'General',
    family: category ?? 'General',
    ...(federal ? { federal: FEDERAL_GUIDE } : {}),
    ...guide,
    recommended: guide.recommended.map((t: { id: string; name: string; description: string; atsFriendly: boolean }) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      atsFriendly: t.atsFriendly,
    })),
  };
};

interface PreparedResume {
  resume: ResumeData;
  warnings: string[];
}

/** Validates an agent's resume plus optional design overrides into the editor's data shape. */
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const pad = (month: number) => String(month).padStart(2, '0');

/** A date as YYYY-MM (or YYYY), "present" for an ongoing role, or null when it can't be read. */
const normalizeDate = (value: string): string | null => {
  const v = value.trim();
  if (!v || /^\d{4}(-(0[1-9]|1[0-2]))?$/.test(v)) return v;
  if (/^(present|current|now|ongoing|today)$/i.test(v)) return 'present';
  let m = /^(\d{4})[-/.](\d{1,2})([-/.]\d{1,2})?$/.exec(v);
  if (m && +m[2] >= 1 && +m[2] <= 12) return `${m[1]}-${pad(+m[2])}`;
  m = /^(\d{1,2})[/.-](\d{4})$/.exec(v);
  if (m && +m[1] >= 1 && +m[1] <= 12) return `${m[2]}-${pad(+m[1])}`;
  m = /^([a-z]{3,9})\.?,?\s+(\d{4})$/i.exec(v);
  const month = m ? MONTHS.indexOf(m[1].slice(0, 3).toLowerCase()) : -1;
  if (m && month >= 0) return `${m[2]}-${pad(month + 1)}`;
  return null;
};

/** A template id, matched case-insensitively against ids and display names ("Ledger" → "banking"). */
const resolveTemplate = (value: string) => {
  const key = currentTemplateId(value.trim().toLowerCase());
  return TEMPLATES.find((t) => t.id === key) ?? TEMPLATES.find((t) => t.name.toLowerCase() === key);
};

const prepareResume = (input: Json): PreparedResume => {
  if (typeof input.resume === 'string') {
    // Models sometimes pass the resume as a JSON string.
    try {
      input = { ...input, resume: JSON.parse(input.resume) };
    } catch {
      throw new AgentError(400, 'INVALID_RESUME', '`resume` must be a JSON object, not a string.');
    }
  }
  const resume = sanitizeResumeData(input.resume);
  if (!resume) {
    throw new AgentError(
      400,
      'INVALID_RESUME',
      '`resume` must be a ModernCV resume (see /resume.schema.json) or a JSON Resume document with `basics`.'
    );
  }
  const warnings: string[] = [];
  const raw = input.resume as Json;
  const template =
    typeof input.template === 'string' ? input.template : typeof input.templateId === 'string' ? input.templateId : typeof raw.templateId === 'string' ? raw.templateId : '';
  const resolved = template ? resolveTemplate(template) : undefined;
  if (template && !resolved) {
    throw new AgentError(400, 'INVALID_TEMPLATE', `Unknown template "${template}". Valid ids: ${TEMPLATES.map((t) => t.id).join(', ')} (list_templates / GET /api/agent/templates describes them).`);
  }
  resume.templateId = resolved?.id ?? 'modern';

  if (typeof input.accent === 'string' && input.accent) {
    if (/^#[0-9a-f]{6}$/i.test(input.accent)) resume.design.accent = input.accent;
    else warnings.push(`Ignored accent "${input.accent}"; use a hex colour like #1F6E73.`);
  }
  if (typeof input.font === 'string' && input.font) {
    if (FONT_IDS.includes(input.font)) resume.design.font = input.font;
    else warnings.push(`Ignored font "${input.font}"; valid fonts: ${FONT_IDS.join(', ')}.`);
  }
  if (input.scale !== undefined && input.scale !== null && input.scale !== '') {
    const scale = typeof input.scale === 'number' ? input.scale : typeof input.scale === 'string' ? Number(input.scale) : NaN;
    if (!Number.isFinite(scale)) warnings.push(`Ignored scale ${JSON.stringify(input.scale)}; use a number from 0.85 to 1.15.`);
    else {
      resume.design.scale = Math.min(1.15, Math.max(0.85, scale));
      if (resume.design.scale !== scale) warnings.push(`scale ${scale} is out of range; used ${resume.design.scale} (allowed 0.85–1.15).`);
    }
  }
  if (!FONT_IDS.includes(resume.design.font)) resume.design.font = 'template';
  if (typeof input.paper === 'string' && input.paper) {
    const paper = input.paper.trim().toLowerCase().replace(/^us[\s-]?letter$/, 'letter');
    if (paper === 'a4' || paper === 'letter') resume.design.paper = paper;
    else warnings.push(`Ignored paper "${input.paper}"; use "a4" or "letter".`);
  }

  // Dates: YYYY-MM is the contract; common other forms are converted rather than printed as typed.
  const fixDate = (entry: { startDate: string; endDate: string }, where: string, current?: { isCurrent?: boolean }) => {
    for (const key of ['startDate', 'endDate'] as const) {
      const fixed = normalizeDate(entry[key]);
      if (fixed === 'present') {
        entry[key] = '';
        if (key === 'endDate' && current) current.isCurrent = true;
      } else if (fixed === null) warnings.push(`${where}.${key} "${entry[key]}" isn't a date; use "YYYY-MM" (e.g. "2021-03").`);
      else entry[key] = fixed;
    }
  };
  resume.experience.forEach((exp, i) => {
    fixDate(exp, `experience[${i}]`, exp);
    if (exp.startDate && !exp.endDate && !exp.isCurrent) warnings.push(`experience[${i}] (${exp.role || exp.company || 'untitled'}) has no endDate; set "isCurrent": true for a current role, or add the end date.`);
  });
  resume.education.forEach((edu, i) => fixDate(edu, `education[${i}]`));

  const rawLinks = Array.isArray(raw.links) ? raw.links.length : 0;
  if (rawLinks > 8) warnings.push(`Only the first 8 links are kept (got ${rawLinks}).`);
  for (const link of resume.links) if (!validateUrl(link.url)) warnings.push(`Link "${link.url}" is not a valid URL and is hidden on the resume.`);
  const rawPhoto = typeof raw.photo === 'string' ? raw.photo : typeof (raw.basics as Json | undefined)?.image === 'string' ? String((raw.basics as Json).image) : '';
  if (rawPhoto && !resume.photo) warnings.push('Ignored photo: it must be a base64 JPEG, PNG or WebP data URL under 200 KB (remote image URLs are not loaded).');
  if (resume.photo && !getTemplateById(resume.templateId)?.photo) warnings.push(`Template "${resume.templateId}" doesn't show photos; photo templates: ${TEMPLATES.filter((t) => t.photo).map((t) => t.id).join(', ')}.`);
  const config = getTemplateById(resume.templateId);
  if ((resume.publications?.length || resume.talks?.length || resume.teaching?.length) && !config?.publications) warnings.push(`Template "${resume.templateId}" doesn't show publications, talks or teaching; academic templates: ${TEMPLATES.filter((t) => t.publications).map((t) => t.id).join(', ')}.`);
  if (resume.awards?.length && !showsAwards(config)) warnings.push(`Template "${resume.templateId}" doesn't show grants and awards; templates that do: ${TEMPLATES.filter(showsAwards).map((t) => t.id).join(', ')}.`);
  if (getTemplateById(resume.templateId)?.hours) {
    const missing = resume.experience.filter((exp) => !exp.hours).length;
    if (missing) warnings.push(`${missing} experience entr${missing === 1 ? 'y has' : 'ies have'} no hours (hours per week); federal resumes on USAJOBS need them for every job.`);
    if (resume.design.paper !== 'letter') warnings.push('Federal resumes are read on US Letter; pass paper "letter" so the page count matches USAJOBS.');
  }
  if (!resume.fullName.trim()) warnings.push('fullName is empty.');
  if (!resume.email && !resume.phone) warnings.push('No email or phone; recruiters need a way to reach the candidate.');
  if (!resume.experience.length && !resume.education.length) warnings.push('No experience or education entries.');
  resume.experience.forEach((exp, i) => {
    if (!exp.description.trim()) warnings.push(`experience[${i}] (${exp.role || exp.company || 'untitled'}) has no bullet points.`);
  });
  if (resume.summary.length > 700) warnings.push('summary is long (over 700 characters); 2–3 sentences read best.');
  return { resume, warnings };
};

/** Payload for `#resume=`: the editor regenerates ids, so drop them to keep links short. */
const toLinkPayload = (resume: ResumeData) => ({
  ...resume,
  experience: resume.experience.map(({ id: _id, ...rest }) => rest),
  education: resume.education.map(({ id: _id, ...rest }) => rest),
  projects: resume.projects.map(({ id: _id, ...rest }) => rest),
  ...(resume.publications ? { publications: resume.publications.map(({ id: _id, ...rest }) => rest) } : {}),
  ...(resume.awards ? { awards: resume.awards.map(({ id: _id, ...rest }) => rest) } : {}),
  ...(resume.talks ? { talks: resume.talks.map(({ id: _id, ...rest }) => rest) } : {}),
  ...(resume.teaching ? { teaching: resume.teaching.map(({ id: _id, ...rest }) => rest) } : {}),
});

const createEditorLink = async (origin: string, input: Json) => {
  const { resume, warnings } = prepareResume(input);
  const url = `${origin}/editor/#resume=${await encodeResumePayload(toLinkPayload(resume))}`;
  return { url, template: resume.templateId, warnings };
};

/** The resume as a standalone .tex file, with what is needed to open it in Overleaf. */
const exportLatex = (input: Json) => {
  const { resume, warnings } = prepareResume(input);
  const tex = toLatex(resume);
  const engine = latexEngine(resume);
  const filename = `${(resume.fullName.trim() || 'resume').replace(/\s+/g, '_').replace(/[^\p{L}\p{N}_.-]/gu, '').toLowerCase() || 'resume'}-resume.tex`;
  return {
    filename,
    engine,
    tex,
    overleaf: {
      note: 'Overleaf opens a .tex through a form POST (a browser action): POST https://www.overleaf.com/docs with form fields encoded_snip (URL-encoded tex), snip_name and engine. Or the user can create a blank Overleaf project and paste the file.',
      action: 'https://www.overleaf.com/docs',
      fields: { snip_name: filename, engine },
    },
    // The .tex has its own layout and includes every section, so template warnings don't apply.
    warnings: warnings.filter((warning) => !/^(Template|Unknown template) "/.test(warning)),
  };
};

const KIND_IDS = Object.keys(PUBLICATION_KINDS) as PublicationKind[];

/**
 * Publications from a public ORCID record or BibTeX source, each with a `kind`, optionally filtered by
 * kind and an inclusive year range. Agents put the chosen ones (without `kind`) in `resume.publications`.
 */
const importPublications = async (input: Json, deps: AgentDeps) => {
  const orcidInput = typeof input.orcid === 'string' ? input.orcid.trim() : '';
  const bibtex = typeof input.bibtex === 'string' ? input.bibtex : '';
  if (!orcidInput === !bibtex.trim()) throw new AgentError(400, 'INVALID_REQUEST', 'Give exactly one of `orcid` (an ORCID iD or orcid.org URL) or `bibtex` (the contents of a .bib file).');
  let found: ImportedPublication[];
  let listed: number;
  let source: string;
  if (orcidInput) {
    const orcid = normalizeOrcid(orcidInput);
    if (!orcid) throw new AgentError(400, 'INVALID_ORCID', 'Not a valid ORCID iD; use the form 0000-0002-1825-0097.');
    if (!(await deps.rateLimit(`orcid:ip:${deps.clientIp}`, LIMITS.orcidPerIp))) throw new AgentError(429, 'RATE_LIMITED', 'Too many ORCID requests. Wait a minute and retry.');
    if (!(await deps.rateLimit('orcid:global', LIMITS.orcidGlobal))) throw new AgentError(429, 'RATE_LIMITED', 'Many ORCID imports are running right now. Wait a minute and retry.');
    try {
      ({ publications: found, listed } = await fetchOrcidPublications(orcid));
    } catch (error) {
      if (error instanceof OrcidError) throw new AgentError(error.status, error.code, error.message);
      throw new AgentError(502, 'UPSTREAM_UNAVAILABLE', 'Could not reach ORCID. Try again later.');
    }
    source = `https://orcid.org/${orcid}`;
  } else {
    found = parseBibtex(bibtex);
    listed = found.length;
    source = 'bibtex';
  }
  const kindList = typeof input.kinds === 'string' ? input.kinds.split(/[\s,]+/) : input.kinds;
  const kinds = Array.isArray(kindList) ? kindList.filter((kind): kind is PublicationKind => KIND_IDS.includes(kind as PublicationKind)) : [];
  const year = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : typeof value === 'string' && /^\d{4}$/.test(value) ? Number(value) : null);
  const fromYear = year(input.from_year);
  const toYear = year(input.to_year);
  const counts = Object.fromEntries(KIND_IDS.map((kind) => [kind, found.filter((pub) => pub.kind === kind).length]).filter(([, n]) => n));
  // Works without a year are dropped only when a year range is given.
  const publications = found
    .filter((pub) => !kinds.length || kinds.includes(pub.kind))
    .filter((pub) => {
      if (fromYear === null && toYear === null) return true;
      const y = Number(/\d{4}/.exec(pub.year)?.[0] ?? NaN);
      return Number.isFinite(y) && (fromYear === null || y >= fromYear) && (toYear === null || y <= toYear);
    })
    .map(({ id: _id, ...pub }) => pub);
  return { source, listed, found: found.length, counts, returned: publications.length, publications };
};

/** Page count of a Chromium-generated PDF (its single page tree's /Count). */
export const pdfPageCount = (pdf: Uint8Array): number => {
  const text = new TextDecoder('latin1').decode(pdf);
  return Math.max(0, ...Array.from(text.matchAll(/\/Count (\d+)/g), (match) => Number(match[1])));
};

// ---------------------------------------------------------------------------------------------
// PDF download links. Stateless: the link holds the prepared resume and an expiry, deflated and
// encrypted with AES-GCM (key derived from AI_SIGNING_SECRET), so nothing is stored and URL logs or
// browser history only ever see ciphertext. Opening it renders the PDF again.
// ---------------------------------------------------------------------------------------------

const pipeBytes = async (bytes: Uint8Array, stream: CompressionStream | DecompressionStream) =>
  new Uint8Array(await new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream)).arrayBuffer());

const toBase64Url = (bytes: Uint8Array) => toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromBase64Url = (value: string) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4)), (c) => c.charCodeAt(0));
};

const linkKey = async (env: AgentEnv): Promise<CryptoKey | null> => {
  const secret = env.AI_SIGNING_SECRET?.trim();
  if (!secret) return null;
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(), info: new TextEncoder().encode('moderncv:pdf-download-link:v1') },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

const pdfFilename = (resume: ResumeData) =>
  `${(resume.fullName.trim() || 'resume').replace(/\s+/g, '_').replace(/[^\p{L}\p{N}_.-]/gu, '').toLowerCase() || 'resume'}-resume.pdf`;

/** A URL that downloads this resume as a PDF for 7 days, or null (no secret configured, or too long). */
const pdfDownloadLink = async (env: AgentEnv, origin: string, resume: ResumeData) => {
  const key = await linkKey(env);
  if (!key) return null;
  const expires = Date.now() + DOWNLOAD_TTL_MS;
  const plain = await pipeBytes(new TextEncoder().encode(JSON.stringify({ exp: expires, resume: toLinkPayload(resume) })), new CompressionStream('deflate-raw'));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
  const token = new Uint8Array(iv.length + sealed.length);
  token.set(iv);
  token.set(sealed, iv.length);
  const url = `${origin}${AGENT_API_PREFIX}${DOWNLOAD_PATH}${toBase64Url(token)}/${encodeURIComponent(pdfFilename(resume))}`;
  return url.length > MAX_DOWNLOAD_URL_CHARS ? null : { url, expiresAt: new Date(expires).toISOString() };
};

/** The resume input a download link was made from; throws when the link is invalid or expired. */
const openDownloadLink = async (env: AgentEnv, token: string): Promise<Json> => {
  const key = await linkKey(env);
  if (!key) throw new AgentError(503, 'UPSTREAM_UNAVAILABLE', 'Download links are not configured on this server.');
  let payload: { exp?: unknown; resume?: unknown };
  try {
    const bytes = fromBase64Url(token);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.subarray(0, 12) }, key, bytes.subarray(12));
    payload = JSON.parse(new TextDecoder().decode(await pipeBytes(new Uint8Array(plain), new DecompressionStream('deflate-raw'))));
  } catch {
    throw new AgentError(404, 'INVALID_LINK', 'This download link is not valid. Ask the assistant for a new one.');
  }
  if (typeof payload.exp !== 'number' || payload.exp < Date.now()) {
    throw new AgentError(410, 'LINK_EXPIRED', 'This download link has expired (links last 7 days). Ask the assistant for a new one.');
  }
  return { resume: payload.resume };
};

interface RenderResult {
  bytes: Uint8Array;
  pages: number;
  template: string;
  resume: ResumeData;
  warnings: string[];
}

/** Opens `/render/#resume=…` in Cloudflare Browser Rendering and prints it (pdf) or snapshots page 1 (png). */
const renderResume = async (env: AgentEnv, deps: AgentDeps, origin: string, input: Json, format: 'pdf' | 'png'): Promise<RenderResult> => {
  const { resume, warnings } = prepareResume(input);
  if (!env.BROWSER) throw new AgentError(503, 'UPSTREAM_UNAVAILABLE', 'Rendering is not configured on this server.');
  // Only valid input spends the render budget.
  await consumeRender(deps);
  const renderUrl = `${env.RENDER_ORIGIN || origin}/render/#resume=${await encodeResumePayload(toLinkPayload(resume))}`;

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let timedOut = false;
  try {
    const job = (async () => {
      browser = await puppeteer.launch(env.BROWSER!);
      // A launch that finishes after the timeout would otherwise keep its browser open until it idles out.
      if (timedOut) {
        await browser.close().catch(() => undefined);
        throw new AgentError(504, 'UPSTREAM_TIMEOUT', 'Rendering timed out.');
      }
      const page = await browser.newPage();
      await page.setBypassCSP(true);
      const { widthMm, heightMm } = paperSize(resume.design.paper);
      const [widthPx, heightPx] = [Math.round(widthMm * MM_TO_PX), Math.round(heightMm * MM_TO_PX)];
      await page.setViewport({ width: widthPx, height: heightPx, deviceScaleFactor: 1 });
      await page.goto(renderUrl, { waitUntil: 'networkidle0' });
      await page.waitForSelector('html[data-render-state]', { timeout: 20000 });
      const [state, pagesText, fitScaleText] = await page.evaluate(() => [
        document.documentElement.dataset.renderState,
        document.documentElement.dataset.renderPages,
        document.documentElement.dataset.renderFitScale,
      ]);
      if (state !== 'ready') throw new AgentError(400, 'INVALID_RESUME', 'The resume could not be rendered.');
      // RenderView paginates like print; the PNG is page 1 in screen layout; only the PDF switches to print media.
      // A PDF reports the pages it actually has, so `pages` and the warnings can never disagree with the file.
      if (format === 'pdf') await page.emulateMediaType('print');
      const bytes = new Uint8Array(
        format === 'pdf'
          ? await page.pdf({ format: resume.design.paper === 'letter' ? 'Letter' : 'A4', printBackground: true, preferCSSPageSize: true })
          : await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: widthPx, height: heightPx } })
      );
      const pages = Math.max(1, (format === 'pdf' && pdfPageCount(bytes)) || Number(pagesText) || 1);
      return { bytes, pages, fitScale: fitScaleText ? Number(fitScaleText) : null };
    })();
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        timedOut = true;
        reject(new AgentError(504, 'UPSTREAM_TIMEOUT', 'Rendering timed out.'));
      }, RENDER_TIMEOUT_MS);
    });
    const { bytes, pages, fitScale } = await Promise.race([job, timeout]);
    const maxPages = getTemplateById(resume.templateId)?.maxPages;
    if (maxPages) {
      // Formats with a page limit (USAJOBS: 2) are judged against it, not against one page.
      if (pages > maxPages)
        warnings.push(
          `The resume runs to ${pages} pages, but USAJOBS limits federal resumes to ${maxPages} and may not consider longer ones. ` +
            (fitScale
              ? `It fits on ${maxPages} pages at "scale": ${fitScale}, or shorten older roles and bullets.`
              : `It doesn't fit on ${maxPages} even at the smallest scale (0.85); shorten older roles and bullets.`)
        );
    } else if (pages > 1) {
      warnings.push(
        fitScale
          ? `The resume runs to ${pages} pages. It fits on one page at "scale": ${fitScale}, or shorten a few bullets.`
          : `The resume runs to ${pages} pages and doesn't fit on one even at the smallest scale (0.85). Shorten bullets, drop older roles, or use the "compact" template.`
      );
    }
    return { bytes, pages, template: resume.templateId, resume, warnings };
  } catch (error) {
    if (error instanceof AgentError) throw error;
    const message = error instanceof Error ? error.message : String(error);
    console.error('[agent] render failed', { message });
    if (/\b429\b|rate.?limit/i.test(message)) throw new AgentError(429, 'UPSTREAM_RATE_LIMIT', 'Rendering is busy. Try again in a minute.');
    throw new AgentError(503, 'UPSTREAM_UNAVAILABLE', 'Rendering is temporarily unavailable.');
  } finally {
    clearTimeout(timeoutId);
    await browser?.close().catch(() => undefined);
  }
};

const getResumeSchema = async (env: AgentEnv, origin: string): Promise<Json> => {
  const response = await env.ASSETS.fetch(new Request(`${origin}/resume.schema.json`));
  if (!response.ok) throw new AgentError(503, 'UPSTREAM_UNAVAILABLE', 'Schema is unavailable.');
  return (await response.json()) as Json;
};

const consumeRender = async (deps: AgentDeps) => {
  if (!(await deps.rateLimit(`agent-render:ip:${deps.clientIp}`, LIMITS.rendersPerIp))) {
    throw new AgentError(429, 'RATE_LIMITED', `Rendering is limited to ${LIMITS.rendersPerIp} per minute. Wait a minute and retry.`);
  }
  if (!(await deps.rateLimit('agent-render:global', LIMITS.rendersGlobal))) {
    throw new AgentError(429, 'RATE_LIMITED', 'Rendering is busy. Try again in a minute.');
  }
};

const toBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};

// ---------------------------------------------------------------------------------------------
// MCP tools
// ---------------------------------------------------------------------------------------------

const RESUME_INPUT = {
  resume: {
    type: 'object',
    description:
      'The resume. ModernCV shape (fullName, title, email, phone, location, website, linkedin, links[{label,url}] for GitHub/portfolio/X/Scholar etc., optional photo (base64 JPEG/PNG data URL, shown only by photo templates), summary, experience[] (add hours, e.g. "40", per job for the federal template), education[], projects[], publications[{authors,title,venue,year,link}], awards[{title,issuer,year,detail}], talks[{title,event,location,year}] and teaching[{course,role,institution,year}] for academic CVs, skills[]; see get_resume_schema) or a JSON Resume document (https://jsonresume.org/schema). Experience descriptions use one bullet per line starting with "- ". Dates are "YYYY-MM". Skills may be grouped as "Category: item, item".',
  },
  template: { type: 'string', description: 'Template id from list_templates. Default "modern".' },
  accent: { type: 'string', description: 'Accent colour as #RRGGBB. Omit for the template default.' },
  font: { type: 'string', enum: FONT_IDS, description: 'Font preset. "template" keeps the template\'s own fonts.' },
  scale: { type: 'number', minimum: 0.85, maximum: 1.15, description: 'Text size, 0.85–1.15 (1 = default). Lower it to fit one page.' },
  paper: { type: 'string', enum: ['a4', 'letter'], description: 'Paper size: "a4" (default) or "letter" (US Letter, for US and Canadian applications). Letter pages are shorter, so check the page count again.' },
};

interface ToolContext {
  env: AgentEnv;
  origin: string;
  deps: AgentDeps;
}

type ToolContent = Json[];

interface Tool {
  name: string;
  title: string;
  description: string;
  inputSchema: Json;
  annotations: Json;
  run: (args: Json, ctx: ToolContext) => Promise<ToolContent>;
}

const isTruthy = (value: unknown) => value === true || value === 1 || (typeof value === 'string' && /^(1|true|yes)$/i.test(value));

const serverIcons = (origin: string) => [
  { src: `${origin}/icon-256.png`, mimeType: 'image/png', sizes: ['256x256'] },
  { src: `${origin}/favicon.svg`, mimeType: 'image/svg+xml', sizes: ['any'] },
];

const text = (value: unknown): Json => ({ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) });

const TOOLS: Tool[] = [
  {
    name: 'list_templates',
    title: 'List resume templates',
    description:
      `Lists the ${TEMPLATES.length} resume templates with id, description, who each suits, ATS status and a preview image URL. ATS-friendly templates are single-column and parse reliably in applicant tracking systems; recommend them for online applications.`,
    inputSchema: { type: 'object', properties: { ats_only: { type: 'boolean', description: 'Only ATS-friendly templates.' } } },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: async (args, { origin }) => [text({ templates: listTemplates(origin, isTruthy(args.ats_only)) })],
  },
  {
    name: 'get_writing_guide',
    title: 'Get a resume writing guide for a job title',
    description:
      'Returns resume advice for a job title: section order, recommended length, skills to feature, metrics to quantify, example bullet points, recruiter tips, recommended templates and FAQs. Use it before drafting.',
    inputSchema: {
      type: 'object',
      properties: { job_title: { type: 'string', description: 'Target job title, e.g. "Senior Product Designer".' } },
      required: ['job_title'],
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: async (args) => [text(getWritingGuide(String(args.job_title ?? '')))],
  },
  {
    name: 'get_example_resume',
    title: 'Get an example resume for a job title',
    description:
      'Returns a complete, realistic example resume written for a job title (summary, experience with quantified bullets, education, projects, grouped skills), as { jobTitle, family, page, resume }. Its \`resume\` field is render-ready but has a placeholder name and no contact details. Use it as a model for structure, tone and level of detail. Never copy its employers, dates or numbers into a real person\'s resume.',
    inputSchema: {
      type: 'object',
      properties: { job_title: { type: 'string', description: 'Job title, e.g. "Registered Nurse (RN)", "nurse" or "Senior Data Analyst".' } },
      required: ['job_title'],
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: async (args, { env, origin }) => [text(await getExampleResume(env, origin, String(args.job_title ?? '')))],
  },
  {
    name: 'get_resume_schema',
    title: 'Get the resume JSON Schema',
    description: 'Returns the JSON Schema for the resume object accepted by the other tools (JSON Resume documents are accepted too).',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: async (_args, { env, origin }) => [text(await getResumeSchema(env, origin))],
  },
  {
    name: 'create_editor_link',
    title: 'Create an editor link for the user',
    description:
      'Returns a URL that opens the ModernCV editor with this resume loaded, so the user can review it, edit, switch templates and download the PDF. The resume is carried in the URL fragment and is never stored on the server. Also returns content warnings to fix.',
    inputSchema: { type: 'object', properties: RESUME_INPUT, required: ['resume'] },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: async (args, { origin }) => {
      const result = await createEditorLink(origin, args);
      return [
        text(`Editor link (opens with the resume loaded; give it to the user):\n${result.url}`),
        text({ template: result.template, warnings: result.warnings }),
      ];
    },
  },
  {
    name: 'import_publications',
    title: 'Import publications from ORCID or BibTeX',
    description:
      'Reads publications from a public ORCID record (up to 4,000 works, duplicates merged, newest first) or from BibTeX text, and returns them as resume publications [{authors,title,venue,year,link,kind}] with counts per kind. Filter with kinds (journal, conference, preprint, book, thesis, other) and from_year/to_year to keep a CV focused. Put the chosen entries, without `kind`, in resume.publications and use an academic template (publications: true in list_templates).',
    inputSchema: {
      type: 'object',
      properties: {
        orcid: { type: 'string', description: 'ORCID iD or orcid.org URL, e.g. "0000-0002-1825-0097".' },
        bibtex: { type: 'string', description: 'Contents of a .bib file (Google Scholar, DBLP, Zotero exports).' },
        kinds: { type: 'array', items: { type: 'string', enum: KIND_IDS }, description: 'Only these kinds. Omit for all.' },
        from_year: { type: 'integer', description: 'Earliest year to keep, inclusive.' },
        to_year: { type: 'integer', description: 'Latest year to keep, inclusive.' },
      },
    },
    annotations: { readOnlyHint: true, openWorldHint: true },
    run: async (args, { deps }) => [text(await importPublications(args, deps))],
  },
  {
    name: 'export_latex',
    title: 'Export the resume as LaTeX',
    description:
      'Returns the resume as a standalone .tex file (article class, packages in every TeX Live; XeLaTeX with xeCJK when the text has CJK characters), with the filename, engine and how to open it in Overleaf. Includes publications, grants and awards, talks and teaching.',
    inputSchema: { type: 'object', properties: { resume: RESUME_INPUT.resume }, required: ['resume'] },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: async (args) => {
      const { tex, ...meta } = exportLatex(args);
      return [text(meta), text(tex)];
    },
  },
  {
    name: 'render_preview',
    title: 'Preview the first page as an image',
    description:
      'Renders the resume with the chosen template and returns page 1 as a PNG, plus the page count and warnings. Use it to check layout and length before rendering the PDF. Rendering is rate limited; after a rate-limit error wait a minute and retry.',
    inputSchema: { type: 'object', properties: RESUME_INPUT, required: ['resume'] },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: async (args, { env, origin, deps }) => {
      const result = await renderResume(env, deps, origin, args, 'png');
      return [
        { type: 'image', data: toBase64(result.bytes), mimeType: 'image/png' },
        text({ pages: result.pages, template: result.template, warnings: result.warnings }),
      ];
    },
  },
  {
    name: 'render_pdf',
    title: 'Render the resume as a PDF',
    description:
      'Renders the resume to an A4 or US Letter (paper: "letter") vector PDF (selectable text, embedded fonts) and returns download_url, a link that downloads the PDF for 7 days, plus the page count and warnings; if the resume is too long for a link, the PDF is embedded instead. Give the user download_url as a clickable link, and also create_editor_link so they can edit. The link carries the resume encrypted; nothing is stored on the server. Rendering is rate limited; after a rate-limit error wait a minute and retry.',
    inputSchema: { type: 'object', properties: RESUME_INPUT, required: ['resume'] },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: async (args, { env, origin, deps }) => {
      const result = await renderResume(env, deps, origin, args, 'pdf');
      const link = await pdfDownloadLink(env, origin, result.resume);
      const summary = { pages: result.pages, template: result.template, bytes: result.bytes.length, warnings: result.warnings };
      if (link) return [text({ download_url: link.url, expires_at: link.expiresAt, ...summary })];
      // Too long for a URL (or links not configured): embed the file instead.
      return [
        text({ ...summary, note: 'The PDF is embedded below; it was too large for a download link. Also give the user create_editor_link.' }),
        { type: 'resource', resource: { uri: 'moderncv://resume.pdf', mimeType: 'application/pdf', blob: toBase64(result.bytes) } },
      ];
    },
  },
];

const SERVER_INSTRUCTIONS = `ModernCV builds resumes with ${TEMPLATES.length} professional templates and exports vector PDFs. Free, no account.
Workflow: 1) get_writing_guide and get_example_resume for the target job title; 2) draft the resume JSON (get_resume_schema) from facts the user gave you, never invent employers, dates or metrics; 3) pick a template with list_templates (prefer ATS-friendly for online applications); 4) render_preview to check layout and page count, then shorten or lower scale until it fits; 5) render_pdf returns download_url (a 7-day PDF download link) to give the user, and create_editor_link so they can review and edit it in the browser.
US federal jobs (USAJOBS): template "federal" with paper "letter", hours per week on every job (experience[].hours), dates as YYYY-MM like every template (federal prints them as MM/YYYY) and series/grade in the job title, e.g. "Program Analyst, GS-0343-12"; at most 2 pages (render_pdf warns above that). Awards go in awards[] (shown as Honors and Awards); certifications and licenses go in skills as "Certifications: PMP, PMI, 2022; CISSP, ISC2, 2024" (semicolons between credentials) and get their own section, one per line; a clearance goes in skills as "Security Clearance: Top Secret/SCI, active" and is listed first in that section. Academic CVs: import_publications reads an ORCID record or BibTeX (filter by kind and year), and publications, awards, talks and teaching show in templates with publications: true. Existing LaTeX CV: read the .tex yourself and map it to the resume JSON. export_latex returns the resume as a .tex file for Overleaf.`;

// ---------------------------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------------------------

const AGENT_CORS_HEADERS: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, HEAD, POST, OPTIONS',
  'access-control-allow-headers': 'content-type, accept, mcp-protocol-version, mcp-session-id, authorization',
  'access-control-expose-headers': 'x-resume-pages, x-resume-warnings',
  'access-control-max-age': '86400',
};

const withAgentHeaders = (response: Response): Response => {
  const out = new Response(response.body, response);
  for (const [key, value] of Object.entries(AGENT_CORS_HEADERS)) out.headers.set(key, value);
  out.headers.set('cache-control', 'no-store');
  return out;
};

const json = (body: unknown, status = 200, headers: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...headers } });

const readJson = async (request: Request): Promise<unknown> => {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > MAX_AGENT_BODY_BYTES) throw new AgentError(413, 'REQUEST_TOO_LARGE', 'Request body is too large (max 256 KB).');
  const raw = await request.text();
  if (raw.length > MAX_AGENT_BODY_BYTES) throw new AgentError(413, 'REQUEST_TOO_LARGE', 'Request body is too large (max 256 KB).');
  try {
    return JSON.parse(raw);
  } catch {
    throw new AgentError(400, 'INVALID_JSON', 'Request body must be valid JSON.');
  }
};

const rpcError = (id: unknown, code: number, message: string) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });

const handleRpcMessage = async (message: unknown, ctx: ToolContext): Promise<Json | null> => {
  if (!message || typeof message !== 'object' || Array.isArray(message) || (message as Json).jsonrpc !== '2.0') {
    return rpcError(null, -32600, 'Invalid JSON-RPC request.');
  }
  const { id, method, params } = message as { id?: unknown; method?: unknown; params?: Json };
  if (id === undefined) return null; // notification (e.g. notifications/initialized): nothing to return
  if (id === null || (typeof id !== 'string' && typeof id !== 'number')) return rpcError(null, -32600, 'Request id must be a string or number.');
  if (method === undefined && ('result' in (message as Json) || 'error' in (message as Json))) return null; // a client response: accept, no reply
  const reply = (result: unknown) => ({ jsonrpc: '2.0', id, result });

  switch (method) {
    case 'initialize': {
      const requested = typeof params?.protocolVersion === 'string' ? params.protocolVersion : '';
      return reply({
        protocolVersion: MCP_PROTOCOL_VERSIONS.includes(requested) ? requested : MCP_PROTOCOL_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'moderncv', title: 'ModernCV Resume Builder', version: SERVER_VERSION, websiteUrl: ctx.origin, icons: serverIcons(ctx.origin) },
        instructions: SERVER_INSTRUCTIONS,
      });
    }
    case 'ping':
      return reply({});
    case 'tools/list':
      return reply({
        tools: TOOLS.map(({ name, title, description, inputSchema, annotations }) => ({ name, title, description, inputSchema, annotations })),
      });
    case 'tools/call': {
      const tool = TOOLS.find((t) => t.name === params?.name);
      if (!tool) return rpcError(id, -32602, `Unknown tool: ${String(params?.name)}`);
      // initialize, tools/list and ping are free; every tool call counts toward the per-IP request limit.
      if (!(await ctx.deps.rateLimit(`agent:ip:${ctx.deps.clientIp}`, LIMITS.requestsPerIp))) {
        return reply({ content: [text('Too many requests from this network. Wait a minute and retry.')], isError: true });
      }
      const args = params?.arguments && typeof params.arguments === 'object' ? (params.arguments as Json) : {};
      try {
        const content = await tool.run(args, ctx);
        // JSON results also go out as structuredContent so clients can read fields without parsing text.
        const first = content[0];
        const structured = first?.type === 'text' && typeof first.text === 'string' && first.text.startsWith('{') ? JSON.parse(first.text) : undefined;
        return reply(structured ? { content, structuredContent: structured } : { content });
      } catch (error) {
        const messageText = error instanceof AgentError ? error.message : 'The tool failed unexpectedly.';
        if (!(error instanceof AgentError)) console.error('[mcp] tool failed', { tool: tool.name, error: String(error) });
        return reply({ content: [text(messageText)], isError: true });
      }
    }
    default:
      return rpcError(id, -32601, `Method not found: ${String(method)}`);
  }
};

const handleMcp = async (request: Request, ctx: ToolContext): Promise<Response> => {
  if (request.method === 'GET' || request.method === 'DELETE') {
    // Stateless server: no server-initiated stream and no sessions to end.
    return json(rpcError(null, -32000, 'Use POST for MCP requests.'), 405, { allow: 'POST, OPTIONS' });
  }
  if (request.method !== 'POST') return json(rpcError(null, -32000, 'Method not allowed.'), 405, { allow: 'POST, OPTIONS' });

  let body: unknown;
  try {
    body = await readJson(request);
  } catch (error) {
    const err = error as AgentError;
    return json(rpcError(null, err.code === 'INVALID_JSON' ? -32700 : -32600, err.message), err.status);
  }
  if (Array.isArray(body) && (!body.length || body.length > MAX_RPC_BATCH)) {
    return json(rpcError(null, -32600, body.length ? `Batches are limited to ${MAX_RPC_BATCH} messages.` : 'Empty batch.'), 400);
  }
  const messages = Array.isArray(body) ? body : [body];
  const replies = (await Promise.all(messages.map((m) => handleRpcMessage(m, ctx)))).filter((r): r is Json => r !== null);
  if (!replies.length) return new Response(null, { status: 202 });
  return json(Array.isArray(body) ? replies : replies[0]);
};

const handleHttpApi = async (request: Request, url: URL, ctx: ToolContext): Promise<Response> => {
  const route = url.pathname.slice(AGENT_API_PREFIX.length).replace(/\/$/, '');
  const fail = (status: number, code: string, message: string) => json({ error: { code, message } }, status);
  // A known route called with the wrong method says so (with Allow), rather than claiming the route doesn't exist.
  const notAllowed = (allow: string, message: string) => json({ error: { code: 'METHOD_NOT_ALLOWED', message } }, 405, { allow });

  if (route === 'templates' || route === 'guide' || route === 'example') {
    if (request.method !== 'GET' && request.method !== 'HEAD') return notAllowed('GET, HEAD', 'Use GET with query parameters.');
    if (route === 'templates') return json({ templates: listTemplates(ctx.origin, isTruthy(url.searchParams.get('ats_only'))) });
    if (route === 'guide') return json(getWritingGuide(url.searchParams.get('job_title') ?? ''));
    return json(await getExampleResume(ctx.env, ctx.origin, url.searchParams.get('job_title') ?? ''));
  }
  if (route === 'latex' || route === 'publications') {
    if (request.method !== 'POST') return notAllowed('POST', 'Use POST with a JSON body.');
    const body = await readJson(request);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return fail(400, 'INVALID_REQUEST', 'Body must be a JSON object.');
    return json(route === 'latex' ? exportLatex(body as Json) : await importPublications(body as Json, ctx.deps));
  }
  if (route.startsWith(DOWNLOAD_PATH)) {
    if (request.method !== 'GET' && request.method !== 'HEAD') return notAllowed('GET, HEAD', 'Open the link with GET.');
    const [token = '', name = 'resume.pdf'] = route.slice(DOWNLOAD_PATH.length).split('/');
    const input = await openDownloadLink(ctx.env, token);
    // Link previews and mail scanners often probe with HEAD: answer without spending a render.
    if (request.method === 'HEAD') return new Response(null, { headers: { 'content-type': 'application/pdf' } });
    const result = await renderResume(ctx.env, ctx.deps, ctx.origin, input, 'pdf');
    const filename = decodeURIComponent(name).replace(/[^\p{L}\p{N}_.-]/gu, '') || 'resume.pdf';
    return new Response(new Blob([result.bytes as BlobPart]), {
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `attachment; filename="${filename.replace(/[^\x20-\x7e]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'x-resume-pages': String(result.pages),
      },
    });
  }
  if (route === 'link' || route === 'pdf' || route === 'preview') {
    if (request.method !== 'POST') return notAllowed('POST', 'Use POST with a JSON body.');
    const body = await readJson(request);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return fail(400, 'INVALID_REQUEST', 'Body must be a JSON object with `resume`.');
    if (route === 'link') return json(await createEditorLink(ctx.origin, body as Json));
    const result = await renderResume(ctx.env, ctx.deps, ctx.origin, body as Json, route === 'pdf' ? 'pdf' : 'png');
    return new Response(new Blob([result.bytes as BlobPart]), {
      headers: {
        'content-type': route === 'pdf' ? 'application/pdf' : 'image/png',
        ...(route === 'pdf' ? { 'content-disposition': `attachment; filename="${pdfFilename(result.resume).replace(/[^\x20-\x7e]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(pdfFilename(result.resume))}` } : {}),
        'x-resume-pages': String(result.pages),
        'x-resume-warnings': encodeURIComponent(JSON.stringify(result.warnings)),
      },
    });
  }
  return fail(404, 'NOT_FOUND', 'Unknown agent API route. See /openapi.json.');
};

/** Entry point for `/mcp` and `/api/agent/*`. Returns null for other paths. */
export const handleAgentRequest = async (request: Request, env: AgentEnv, deps: AgentDeps): Promise<Response | null> => {
  const url = new URL(request.url);
  const isMcp = url.pathname === MCP_PATH || url.pathname === `${MCP_PATH}/`;
  if (!isMcp && !url.pathname.startsWith(AGENT_API_PREFIX)) return null;
  if (request.method === 'OPTIONS') return withAgentHeaders(new Response(null, { status: 204 }));

  const ctx: ToolContext = { env, origin: url.origin, deps };
  try {
    if (!isMcp && !(await deps.rateLimit(`agent:ip:${deps.clientIp}`, LIMITS.requestsPerIp))) {
      throw new AgentError(429, 'RATE_LIMITED', 'Too many requests. Wait a minute and retry.');
    }
    return withAgentHeaders(isMcp ? await handleMcp(request, ctx) : await handleHttpApi(request, url, ctx));
  } catch (error) {
    const err = error instanceof AgentError ? error : new AgentError(500, 'INTERNAL', 'Unexpected error.');
    if (!(error instanceof AgentError)) console.error('[agent] unexpected', { error: String(error) });
    const body = isMcp ? rpcError(null, -32000, err.message) : { error: { code: err.code, message: err.message } };
    return withAgentHeaders(json(body, err.status, err.status === 429 ? { 'retry-after': '60' } : {}));
  }
};
