import { DEFAULT_TEMPLATE_ID, currentTemplateId } from '../constants/templates';
import { validateUrl } from './validation';
import { DEFAULT_DESIGN, type Education, type Experience, type Project, type Award, type Publication, type ResumeData, type Talk, type Teaching, type ResumeDesign, type ResumeLink } from '../types';

/** Text fields; agents often send years and phone numbers as numbers ("year": 2023). */
const str = (value: unknown): string => (typeof value === 'string' ? value : typeof value === 'number' && Number.isFinite(value) ? String(value) : '');

/** URL for a JSON Resume profile that only has a username (e.g. { network: "GitHub", username: "pat" }). */
const PROFILE_HOSTS: Record<string, string> = {
  github: 'github.com/', gitlab: 'gitlab.com/', twitter: 'x.com/', x: 'x.com/', dribbble: 'dribbble.com/',
  behance: 'behance.net/', medium: 'medium.com/@', instagram: 'instagram.com/', youtube: 'youtube.com/@',
  stackoverflow: 'stackoverflow.com/users/', mastodon: '', bluesky: 'bsky.app/profile/',
};
const profileUrl = (network: string, username: string): string => {
  const host = PROFILE_HOSTS[network.toLowerCase().replace(/[^a-z]/g, '')];
  return username && host ? `${host}${username.replace(/^@/, '')}` : '';
};
/** Largest accepted photo data URL (the editor produces roughly 30–90 KB). */
export const MAX_PHOTO_LENGTH = 200_000;
/** Keeps only an inline raster image, so a resume never loads anything from the network. */
export const sanitizePhoto = (value: unknown): string => {
  const photo = str(value).trim();
  return photo.length <= MAX_PHOTO_LENGTH && /^data:image\/(jpeg|png|webp);base64,[a-z0-9+/]+=*$/i.test(photo) ? photo : '';
};
const list = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object') : [];

/** The PDF's document title, which viewers show in the tab or title bar: "Pat Lee – Resume". */
export const resumeDocumentTitle = (data: Pick<ResumeData, 'fullName'>): string =>
  data.fullName.trim() ? `${data.fullName.trim().replace(/\s+/g, ' ')} – Resume` : 'Resume';

export const createId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** An empty resume for "Start from blank". */
export const BLANK_RESUME_DATA: ResumeData = {
  templateId: DEFAULT_TEMPLATE_ID,
  design: DEFAULT_DESIGN,
  fullName: '',
  title: '',
  email: '',
  phone: '',
  location: '',
  website: '',
  linkedin: '',
  links: [],
  summary: '',
  experience: [],
  education: [],
  skills: [],
  projects: [],
};

/** Coerces an untrusted design object, falling back to defaults field by field. */
export const sanitizeDesign = (input: unknown): ResumeDesign => {
  const raw = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  const accent = typeof raw.accent === 'string' && /^#[0-9a-f]{6}$/i.test(raw.accent) ? raw.accent : '';
  const font = typeof raw.font === 'string' && raw.font ? raw.font : DEFAULT_DESIGN.font;
  const scale = typeof raw.scale === 'number' && Number.isFinite(raw.scale) ? Math.min(1.15, Math.max(0.85, raw.scale)) : 1;
  const paper = raw.paper === 'letter' ? 'letter' : 'a4';
  return { accent, font, scale, paper, ...(raw.language === 'en' || raw.language === 'zh' ? { language: raw.language } : {}) };
};

const obj = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string' && v.trim() !== '').map((v) => v.trim()) : [];
/** JSON Resume dates are ISO (YYYY, YYYY-MM or YYYY-MM-DD); the editor stores YYYY-MM. */
const isoMonth = (value: unknown): string => str(value).trim().slice(0, 7);

const MONTH_NAMES = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/**
 * A month typed by hand where the browser has no month picker (Firefox, desktop Safari) → YYYY-MM, the
 * form Chrome's picker gives, so templates, exports and checks read it the same: "Jan 2020",
 * "September 2021", "2020/3", "03/2021", "2020年3月". A year, or anything else, is kept as typed.
 */
export const normalizeMonth = (value: string): string => {
  const text = value.trim();
  const month = (year: string, m: number) => (m >= 1 && m <= 12 ? `${year}-${String(m).padStart(2, '0')}` : value);
  let match = /^(\d{4})\s*[-/.]\s*(\d{1,2})(?:\s*[-/.]\s*\d{1,2})?$/.exec(text) ?? /^(\d{4})\s*年\s*(\d{1,2})\s*月$/.exec(text);
  if (match) return month(match[1], Number(match[2]));
  match = /^(\d{1,2})\s*[-/.]\s*(\d{4})$/.exec(text);
  if (match) return month(match[2], Number(match[1]));
  match = /^([a-z]{3,9})\.?,?\s*(\d{4})$/i.exec(text);
  if (match) {
    const word = match[1].toLowerCase();
    const index = MONTH_NAMES.findIndex((name) => name.startsWith(word));
    if (index >= 0) return month(match[2], index + 1);
  }
  return value;
};
/** Summary text plus highlight bullets, in the editor's "- bullet" description format. */
const describe = (summary: unknown, highlights: unknown): string =>
  [str(summary).trim(), ...strings(highlights).map((h) => `- ${h}`)].filter(Boolean).join('\n');

/** Entries given as plain strings ("PMP") or objects ({ name: "PMP" }). */
const entries = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.map((item) => (typeof item === 'string' || typeof item === 'number' ? { name: item } : obj(item))) : [];

/**
 * Certificates, languages and interests have no section of their own; they become skill groups,
 * the form the editor suggests for them (Federal and Vital print "Certifications:" in their own section).
 * Brackets keep an issuer and year with their certificate when templates split a group at commas.
 * Reads JSON Resume's shapes and the names agents use alongside ModernCV fields.
 */
const extraSkillGroups = (raw: Record<string, unknown>, skills: string[]): string[] => {
  const bracket = (name: string, details: string[]) => (details.length ? `${name} (${details.join(', ')})` : name);
  const certificates = [...entries(raw.certificates), ...entries(raw.certifications), ...entries(raw.licenses)]
    .map((c) => [pick(c, 'name', 'title').trim(), [pick(c, 'issuer', 'organization', 'authority').trim(), (pick(c, 'date', 'year').match(/\d{4}/)?.[0] ?? '')].filter(Boolean)] as const)
    .filter(([name]) => name)
    .map(([name, details]) => bracket(name, details));
  const languages = entries(raw.languages)
    .map((l) => [pick(l, 'language', 'name').trim(), [pick(l, 'fluency', 'level', 'proficiency').trim()].filter(Boolean)] as const)
    .filter(([name]) => name)
    .map(([name, details]) => bracket(name, details));
  const interests = entries(raw.interests).flatMap((i) => (strings(i.keywords).length ? strings(i.keywords) : [str(i.name).trim()])).filter(Boolean);
  // "Languages" usually already names programming languages; spoken ones then get their own label.
  const languagesLabel = skills.some((s) => /^languages\s*[:：]/i.test(s)) ? 'Spoken languages' : 'Languages';
  return [
    ...(certificates.length ? [`Certifications: ${certificates.join(', ')}`] : []),
    ...(languages.length ? [`${languagesLabel}: ${languages.join(', ')}`] : []),
    ...(interests.length ? [`Interests: ${interests.join(', ')}`] : []),
  ];
};

/** Rich-text HTML (Reactive Resume's editor) as plain lines: list items become "- " bullets, paragraphs their own lines. */
const htmlLines = (html: string): string[] =>
  html
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<\/(?:p|li|h\d|div)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line && line !== '-');

/** A date range written as text ("January 2019 to Present", "2014 - 2017", "2014-2017"); a single date is when it ended. */
const dateRange = (text: string) => {
  const parts = text
    .split(/\s+(?:to|until|-)\s+|\s*[–—]\s*|(?<=^\d{4})-(?=\d{4}$)/i)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 1 ? { startDate: parts[0], endDate: parts[parts.length - 1] } : { startDate: '', endDate: parts[0] ?? '' };
};

/**
 * A Reactive Resume (v4) export, { basics, sections: { experience: { items } , … }, metadata }, in the shape
 * sanitizeResumeData reads; hidden items stay out, as they do on that resume. References and custom sections are not read.
 */
const isReactiveResume = (raw: Record<string, unknown>) => !!raw.basics && typeof raw.basics === 'object' && !!raw.sections && typeof raw.sections === 'object' && !Array.isArray(raw.sections);
const fromReactiveResume = (raw: Record<string, unknown>): Record<string, unknown> => {
  const basics = obj(raw.basics);
  const sections = obj(raw.sections);
  const items = (name: string) => list(obj(sections[name]).items).filter((item) => item.visible !== false);
  const href = (item: Record<string, unknown>) => str(obj(item.url).href);
  const text = (html: unknown) => htmlLines(str(html)).join('\n');
  const job = (company: unknown, item: Record<string, unknown>) => ({ company: str(company), role: str(item.position), ...dateRange(str(item.date)), description: text(item.summary) });
  const profiles = items('profiles').map((p) => ({ label: str(p.network), url: href(p) || profileUrl(str(p.network), str(p.username)) }));
  const linkedin = profiles.find((p) => /linkedin/i.test(p.label + p.url));
  return {
    fullName: str(basics.name),
    title: str(basics.headline),
    email: str(basics.email),
    phone: str(basics.phone),
    location: str(basics.location),
    website: href(basics),
    photo: str(obj(basics.picture).url),
    linkedin: linkedin?.url ?? '',
    links: profiles.filter((p) => p !== linkedin),
    summary: text(obj(sections.summary).content),
    experience: [...items('experience').map((e) => job(e.company, e)), ...items('volunteer').map((v) => job(v.organization, v))],
    education: items('education').map((e) => ({ institution: str(e.institution), studyType: str(e.studyType), area: str(e.area), score: str(e.score), ...dateRange(str(e.date)) })),
    projects: items('projects').map((p) => ({ name: str(p.name), link: href(p), description: [str(p.description).trim(), text(p.summary)].filter(Boolean).join('\n') })),
    publications: items('publications').map((p) => ({ title: str(p.name), venue: str(p.publisher), year: str(p.date), link: href(p) })),
    awards: items('awards').map((a) => ({ title: str(a.title), issuer: str(a.awarder), year: str(a.date), detail: htmlLines(str(a.summary)).join(' ') })),
    skills: items('skills').map((sk) => [str(sk.name).trim(), strings(sk.keywords).join(', ')].filter(Boolean).join(': ')),
    certifications: items('certifications').map((c) => ({ name: str(c.name), issuer: str(c.issuer), date: str(c.date) })),
    languages: items('languages').map((l) => ({ name: str(l.name), level: str(l.description) })),
    interests: items('interests').map((i) => ({ name: str(i.name), keywords: i.keywords })),
  };
};

/**
 * Converts a JSON Resume document (https://jsonresume.org/schema) into this app's backup shape,
 * so resumes exported by other tools or written by AI agents can be imported directly.
 */
export const fromJsonResume = (raw: Record<string, unknown>): Record<string, unknown> => {
  const basics = obj(raw.basics);
  // Grouped skills use the "Category: items" convention that templates render as groups.
  const skills = list(raw.skills)
    .map((s) => {
      const keywords = strings(s.keywords);
      return keywords.length ? (str(s.name) ? `${str(s.name)}: ${keywords.join(', ')}` : keywords.join(', ')) : str(s.name);
    })
    .filter((s) => s.trim());
  const location = obj(basics.location);
  const profiles = list(basics.profiles);
  const linkedin = profiles.find((p) => /linkedin/i.test(str(p.network) + str(p.url)));
  return {
    fullName: str(basics.name),
    title: str(basics.label),
    photo: str(basics.image),
    email: str(basics.email),
    phone: str(basics.phone),
    website: str(basics.url) || str(basics.website),
    linkedin: linkedin ? str(linkedin.url) || (str(linkedin.username) ? `linkedin.com/in/${str(linkedin.username)}` : '') : '',
    links: profiles
      .filter((p) => p !== linkedin)
      .map((p) => ({ label: str(p.network), url: str(p.url) || profileUrl(str(p.network), str(p.username)) }))
      .filter((p) => p.url),
    location: [location.city, location.region, location.countryCode].map(str).filter(Boolean).join(', '),
    summary: str(basics.summary),
    // Volunteer roles follow the jobs, as most resumes list them.
    experience: [
      ...list(raw.work).map((w) => [w, str(w.name) || str(w.company)] as const),
      ...list(raw.volunteer).map((v) => [v, str(v.organization)] as const),
    ].map(([w, company]) => ({
      company,
      role: str(w.position),
      startDate: isoMonth(w.startDate),
      endDate: isoMonth(w.endDate),
      isCurrent: !str(w.endDate),
      description: describe(w.summary, w.highlights),
    })),
    education: list(raw.education).map((e) => ({
      school: str(e.institution),
      // A grade goes in the degree line, as Import resume puts it ("BSc in Mathematics; GPA 3.8").
      degree: [[str(e.studyType), str(e.area)].filter(Boolean).join(' in '), str(e.score).trim() && `${/^\d/.test(str(e.score).trim()) ? 'GPA ' : ''}${str(e.score).trim()}`]
        .filter(Boolean)
        .join('; '),
      startDate: isoMonth(e.startDate),
      endDate: isoMonth(e.endDate),
    })),
    publications: list(raw.publications).map((p) => ({
      title: str(p.name),
      venue: str(p.publisher),
      year: str(p.releaseDate).trim().slice(0, 4),
      link: str(p.url),
      authors: str(p.authors),
    })),
    awards: list(raw.awards).map((a) => ({
      title: str(a.title),
      issuer: str(a.awarder),
      year: str(a.date).trim().slice(0, 4),
      detail: str(a.summary),
    })),
    projects: list(raw.projects).map((p) => ({
      name: str(p.name),
      link: str(p.url),
      description: describe(p.description, p.highlights),
    })),
    skills: [
      ...skills,
      ...extraSkillGroups(raw, skills),
    ],
  };
};

/**
 * Coerces untrusted JSON (an imported backup or a JSON Resume document) into a well-formed
 * ResumeData, so templates never see missing fields or non-string values.
 * Returns null if it doesn't look like a resume.
 */
/** Bullets sent as a list (by agents, or a `highlights` array) as the editor's "- bullet" lines; a string stays as written. */
const bulletText = (value: unknown): string =>
  Array.isArray(value) ? strings(value).map((line) => (/^[-•*–]\s/.test(line) ? line : `- ${line}`)).join('\n') : str(value);
/** A description plus any bullet lists next to it, under the names agents use for them. */
const BULLET_KEYS = ['highlights', 'bullets', 'responsibilities', 'achievements', 'accomplishments', 'duties'];
const descriptionOf = (item: Record<string, unknown>): string =>
  [bulletText(item.description ?? item.summary), ...BULLET_KEYS.map((key) => bulletText(item[key]))].filter((part) => part.trim()).join('\n');

/**
 * Skills as the editor stores them (one entry per skill or "Category: a, b" group), from a list of strings, a
 * list of { name | category, keywords | items } groups, or one string ("Python, SQL", or one group per line).
 */
const GROUP_KEYS = ['name', 'category', 'label', 'keywords', 'items', 'skills'];
const skillList = (value: unknown): string[] => {
  if (typeof value === 'string')
    return value
      .split('\n')
      .flatMap((line) => (/[:：]/.test(line) ? [line] : line.split(/[,，、]/)))
      .map((skill) => skill.trim())
      .filter(Boolean);
  const group = (skill: unknown): string[] => {
    if (typeof skill === 'string') return [skill.trim()];
    const item = obj(skill);
    // { "Languages": ["Go", "Python"], "Tools": "Docker, K8s" }: one group per key.
    if (!GROUP_KEYS.some((key) => key in item))
      return Object.entries(item).flatMap(([name, list]) => {
        const items = Array.isArray(list) ? strings(list) : skillList(str(list));
        return items.length && name.trim() ? [`${name.trim()}: ${items.join(', ')}`] : [];
      });
    const name = pick(item, 'name', 'category', 'label').trim();
    const list = item.keywords ?? item.items ?? item.skills;
    const items = Array.isArray(list) ? strings(list) : skillList(str(list));
    return [items.length ? (name ? `${name}: ${items.join(', ')}` : items.join(', ')) : name];
  };
  return (Array.isArray(value) ? value : value && typeof value === 'object' ? [value] : []).flatMap(group).filter(Boolean);
};

/** The first non-empty string among an item's fields: agents name the same field several ways ("title" for a role). */
const pick = (item: Record<string, unknown>, ...keys: string[]): string => keys.map((key) => str(item[key])).find((value) => value.trim()) ?? '';

/** A location sent as { city, region | state, country | countryCode }: "San Francisco, CA, USA". */
const placeOf = (place: Record<string, unknown>) =>
  [pick(place, 'city'), pick(place, 'region', 'state'), pick(place, 'country', 'countryCode')].filter(Boolean).join(', ');

/** A bare DOI ("10.1234/abcd") as a link; DOIs already written as URLs stay as they are. */
const doiLink = (doi: string) => (doi.trim() && !/^https?:/i.test(doi.trim()) ? `https://doi.org/${doi.trim().replace(/^doi:\s*/i, '')}` : doi);

/** "https://www.github.com/pat/" and "github.com/pat" are the same link. */
const sameUrl = (a: string, b: string) => {
  const key = (url: string) => url.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');
  return key(a) === key(b);
};

/** An end date that means the role is ongoing, as agents and other tools write it. */
const ONGOING = /^(present|current|now|ongoing|today|至今|现在)$/i;
/** A start or end date as the editor stores it: "2021-03" for any month form normalizeMonth knows, else as written. */
const dateField = (value: unknown) => normalizeMonth(str(value).trim());

// Top-level fields sanitizeResumeData reads, including the other names agents use for them.
const RESUME_FIELDS = new Set(['templateId', 'design', 'fullName', 'name', 'title', 'headline', 'label', 'email', 'phone', 'location', 'website', 'url', 'homepage', 'linkedin', 'links', 'github', 'portfolio', 'photo', 'summary', 'about', 'profile', 'objective', 'experience', 'work', 'volunteer', 'education', 'skills', 'projects', 'publications', 'awards', 'talks', 'teaching', 'certificates', 'certifications', 'licenses', 'languages', 'interests']);
// JSON Resume sections fromJsonResume reads, plus its metadata (references are not read).
const JSON_RESUME_FIELDS = new Set(['$schema', 'meta', 'templateId', 'design', 'basics', 'work', 'volunteer', 'education', 'awards', 'certificates', 'publications', 'skills', 'languages', 'interests', 'projects']);

/** Top-level fields of a resume that sanitizeResumeData ignores, so callers can say so instead of dropping them silently. */
// Fields of each kind of entry sanitizeResumeData reads, by section; the sections that share a shape share a list.
const JOB_FIELDS = ['id', 'company', 'employer', 'organization', 'organisation', 'name', 'role', 'title', 'position', 'jobTitle', 'startDate', 'endDate', 'isCurrent', 'hours', 'description', 'summary', ...BULLET_KEYS];
const ENTRY_FIELDS: Record<string, Set<string>> = {
  experience: new Set(JOB_FIELDS),
  work: new Set(JOB_FIELDS),
  volunteer: new Set(JOB_FIELDS),
  education: new Set(['id', 'school', 'institution', 'university', 'college', 'degree', 'studyType', 'area', 'field', 'major', 'gpa', 'grade', 'score', 'honors', 'honours', 'thesis', 'startDate', 'endDate']),
  projects: new Set(['id', 'name', 'title', 'link', 'url', 'description', 'summary', ...BULLET_KEYS]),
  publications: new Set(['id', 'authors', 'author', 'title', 'name', 'venue', 'journal', 'conference', 'booktitle', 'publisher', 'year', 'date', 'releaseDate', 'link', 'url', 'doi']),
  awards: new Set(['id', 'title', 'name', 'award', 'issuer', 'awarder', 'organization', 'organisation', 'year', 'date', 'detail', 'summary', 'description']),
  talks: new Set(['id', 'title', 'name', 'event', 'venue', 'conference', 'location', 'year', 'date']),
  teaching: new Set(['id', 'course', 'title', 'name', 'role', 'institution', 'school', 'university', 'year', 'date', 'term']),
  links: new Set(['id', 'label', 'name', 'network', 'url', 'href', 'link']),
};

/**
 * Fields of a resume that sanitizeResumeData ignores ("hobbies", "experience[].location"), so callers can say so
 * instead of dropping them silently. Entries of a JSON Resume document are not checked: its other fields are standard.
 */
export const ignoredResumeFields = (input: unknown): string[] => {
  const raw = obj(input);
  if (isReactiveResume(raw)) return Object.keys(raw).filter((key) => !['basics', 'sections', 'metadata', 'templateId', 'design'].includes(key));
  const jsonResume = !!raw.basics && typeof raw.basics === 'object';
  const known = jsonResume ? JSON_RESUME_FIELDS : RESUME_FIELDS;
  const top = Object.keys(raw).filter((key) => !known.has(key));
  if (jsonResume) return top;
  const nested = Object.entries(ENTRY_FIELDS).flatMap(([section, fields]) =>
    list(raw[section]).flatMap((entry) => Object.keys(entry).filter((key) => !fields.has(key)).map((key) => `${section}[].${key}`))
  );
  return [...top, ...new Set(nested)];
};

export const sanitizeResumeData = (input: unknown): ResumeData | null => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  let raw = input as Record<string, unknown>;
  if (raw.basics && typeof raw.basics === 'object')
    raw = { ...(isReactiveResume(raw) ? fromReactiveResume(raw) : fromJsonResume(raw)), templateId: raw.templateId, design: raw.design };
  const known = ['fullName', 'title', 'summary', 'experience', 'education', 'skills', 'projects'];
  if (!known.some((key) => key in raw)) return null;

  // JSON Resume's "work" sometimes comes beside ModernCV fields (no endDate means current there too);
  // volunteer roles follow the jobs, as they do for JSON Resume.
  const experience: Experience[] = [...list(raw.experience), ...list(raw.work).map((w): Record<string, unknown> => ({ isCurrent: !str(w.endDate).trim(), ...w })), ...list(raw.volunteer)].map((item) => {
    const hours = (typeof item.hours === 'number' ? String(item.hours) : str(item.hours)).trim();
    return {
      id: str(item.id) || createId(),
      company: pick(item, 'company', 'employer', 'organization', 'organisation', 'name'),
      role: pick(item, 'role', 'title', 'position', 'jobTitle'),
      startDate: dateField(item.startDate),
      // "Present" is an ongoing role: the editor's "I currently work here", which every template prints its own way.
      endDate: ONGOING.test(str(item.endDate).trim()) ? '' : dateField(item.endDate),
      isCurrent: item.isCurrent === true || ONGOING.test(str(item.endDate).trim()),
      description: descriptionOf(item),
      ...(hours ? { hours } : {}),
    };
  });
  const education: Education[] = list(raw.education).map((item) => ({
    id: str(item.id) || createId(),
    school: pick(item, 'school', 'institution', 'university', 'college'),
    // A grade, honours and thesis go in the degree line, as Import resume writes them ("BSc in Mathematics; GPA 3.8").
    degree: [
      pick(item, 'degree') || [pick(item, 'studyType'), pick(item, 'area', 'field', 'major')].filter(Boolean).join(' in '),
      ((grade) => (grade && /^\d/.test(grade) ? `GPA ${grade}` : grade))(pick(item, 'gpa', 'grade', 'score').trim()),
      pick(item, 'honors', 'honours').trim(),
      pick(item, 'thesis').trim() && `thesis: ${pick(item, 'thesis').trim()}`,
    ]
      .filter((part) => part.trim())
      .join('; '),
    startDate: dateField(item.startDate),
    endDate: dateField(item.endDate),
  }));
  const projects: Project[] = list(raw.projects).map((item) => ({
    id: str(item.id) || createId(),
    name: pick(item, 'name', 'title'),
    link: pick(item, 'link', 'url'),
    description: descriptionOf(item),
  }));
  const publications: Publication[] = list(raw.publications)
    .map((item) => ({
      id: str(item.id) || createId(),
      authors: (Array.isArray(item.authors) ? strings(item.authors).join(', ') : pick(item, 'authors', 'author')).trim(),
      title: pick(item, 'title', 'name').trim(),
      venue: pick(item, 'venue', 'journal', 'conference', 'booktitle', 'publisher').trim(),
      year: pick(item, 'year', 'date', 'releaseDate').trim(),
      link: (pick(item, 'link', 'url') || doiLink(str(item.doi))).trim(),
    }))
    .filter((item) => item.title || item.authors);
  const awards: Award[] = list(raw.awards)
    .map((item) => ({
      id: str(item.id) || createId(),
      title: pick(item, 'title', 'name', 'award').trim(),
      issuer: pick(item, 'issuer', 'awarder', 'organization', 'organisation').trim(),
      year: pick(item, 'year', 'date').trim(),
      detail: pick(item, 'detail', 'summary', 'description').trim(),
    }))
    .filter((item) => item.title || item.issuer);
  const talks: Talk[] = list(raw.talks)
    .map((item) => ({
      id: str(item.id) || createId(),
      title: pick(item, 'title', 'name').trim(),
      event: pick(item, 'event', 'venue', 'conference').trim(),
      location: str(item.location).trim(),
      year: pick(item, 'year', 'date').trim(),
    }))
    .filter((item) => item.title || item.event);
  const teaching: Teaching[] = list(raw.teaching)
    .map((item) => ({
      id: str(item.id) || createId(),
      course: pick(item, 'course', 'title', 'name').trim(),
      role: str(item.role).trim(),
      institution: pick(item, 'institution', 'school', 'university').trim(),
      year: pick(item, 'year', 'date', 'term').trim(),
    }))
    .filter((item) => item.course || item.role);
  // Links may also come as plain URLs, and GitHub or a portfolio as their own fields.
  const linkItems: Record<string, unknown>[] = [
    ...(Array.isArray(raw.links) ? raw.links.map((item) => (typeof item === 'string' ? { url: item.trim() && validateUrl(item) ? item : '' } : obj(item))) : []),
    ...(['github', 'portfolio'] as const).map((key) => ({ url: str(raw[key]) })),
  ];
  const links: ResumeLink[] = linkItems
    .map((item) => ({ id: str(item.id) || createId(), label: pick(item, 'label', 'name', 'network').trim(), url: pick(item, 'url', 'href', 'link').trim() }))
    .filter((item, index, all) => item.url && all.findIndex((other) => sameUrl(other.url, item.url)) === index)
    .slice(0, 8);
  const listed = skillList(raw.skills);
  const skills = [...listed, ...extraSkillGroups(raw, listed)];

  return {
    templateId: currentTemplateId(str(raw.templateId)) || DEFAULT_TEMPLATE_ID,
    design: sanitizeDesign(raw.design),
    fullName: pick(raw, 'fullName', 'name'),
    title: pick(raw, 'title', 'headline', 'label'),
    email: str(raw.email),
    phone: str(raw.phone),
    location: str(raw.location) || placeOf(obj(raw.location)),
    website: pick(raw, 'website', 'url', 'homepage'),
    linkedin: str(raw.linkedin),
    links,
    ...(sanitizePhoto(raw.photo) ? { photo: sanitizePhoto(raw.photo) } : {}),
    summary: pick(raw, 'summary', 'about', 'profile', 'objective'),
    experience,
    education,
    skills,
    projects,
    ...(publications.length ? { publications } : {}),
    ...(awards.length ? { awards } : {}),
    ...(talks.length ? { talks } : {}),
    ...(teaching.length ? { teaching } : {}),
  };
};
