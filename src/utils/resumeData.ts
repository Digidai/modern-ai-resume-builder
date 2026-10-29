import { DEFAULT_TEMPLATE_ID } from '../constants/templates';
import { DEFAULT_DESIGN, type Education, type Experience, type Project, type Award, type Publication, type ResumeData, type Talk, type Teaching, type ResumeDesign, type ResumeLink } from '../types';

const str = (value: unknown): string => (typeof value === 'string' ? value : '');

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
  return { accent, font, scale };
};

const obj = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string' && v.trim() !== '').map((v) => v.trim()) : [];
/** JSON Resume dates are ISO (YYYY, YYYY-MM or YYYY-MM-DD); the editor stores YYYY-MM. */
const isoMonth = (value: unknown): string => str(value).trim().slice(0, 7);
/** Summary text plus highlight bullets, in the editor's "- bullet" description format. */
const describe = (summary: unknown, highlights: unknown): string =>
  [str(summary).trim(), ...strings(highlights).map((h) => `- ${h}`)].filter(Boolean).join('\n');

/**
 * Converts a JSON Resume document (https://jsonresume.org/schema) into this app's backup shape,
 * so resumes exported by other tools or written by AI agents can be imported directly.
 */
export const fromJsonResume = (raw: Record<string, unknown>): Record<string, unknown> => {
  const basics = obj(raw.basics);
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
    experience: list(raw.work).map((w) => ({
      company: str(w.name) || str(w.company),
      role: str(w.position),
      startDate: isoMonth(w.startDate),
      endDate: isoMonth(w.endDate),
      isCurrent: !str(w.endDate),
      description: describe(w.summary, w.highlights),
    })),
    education: list(raw.education).map((e) => ({
      school: str(e.institution),
      degree: [str(e.studyType), str(e.area)].filter(Boolean).join(' in '),
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
    // Grouped skills use the "Category: items" convention that templates render as groups.
    skills: list(raw.skills)
      .map((s) => {
        const keywords = strings(s.keywords);
        return keywords.length ? (str(s.name) ? `${str(s.name)}: ${keywords.join(', ')}` : keywords.join(', ')) : str(s.name);
      })
      .filter((s) => s.trim()),
  };
};

/**
 * Coerces untrusted JSON (an imported backup or a JSON Resume document) into a well-formed
 * ResumeData, so templates never see missing fields or non-string values.
 * Returns null if it doesn't look like a resume.
 */
export const sanitizeResumeData = (input: unknown): ResumeData | null => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  let raw = input as Record<string, unknown>;
  if (raw.basics && typeof raw.basics === 'object') raw = { ...fromJsonResume(raw), templateId: raw.templateId, design: raw.design };
  const known = ['fullName', 'title', 'summary', 'experience', 'education', 'skills', 'projects'];
  if (!known.some((key) => key in raw)) return null;

  const experience: Experience[] = list(raw.experience).map((item) => ({
    id: str(item.id) || createId(),
    company: str(item.company),
    role: str(item.role),
    startDate: str(item.startDate),
    endDate: str(item.endDate),
    isCurrent: item.isCurrent === true,
    description: str(item.description),
  }));
  const education: Education[] = list(raw.education).map((item) => ({
    id: str(item.id) || createId(),
    school: str(item.school),
    degree: str(item.degree),
    startDate: str(item.startDate),
    endDate: str(item.endDate),
  }));
  const projects: Project[] = list(raw.projects).map((item) => ({
    id: str(item.id) || createId(),
    name: str(item.name),
    link: str(item.link),
    description: str(item.description),
  }));
  const publications: Publication[] = list(raw.publications)
    .map((item) => ({
      id: str(item.id) || createId(),
      authors: str(item.authors).trim(),
      title: str(item.title).trim(),
      venue: str(item.venue).trim(),
      year: str(item.year).trim(),
      link: str(item.link).trim(),
    }))
    .filter((item) => item.title || item.authors);
  const awards: Award[] = list(raw.awards)
    .map((item) => ({
      id: str(item.id) || createId(),
      title: str(item.title).trim(),
      issuer: str(item.issuer).trim(),
      year: str(item.year).trim(),
      detail: str(item.detail).trim(),
    }))
    .filter((item) => item.title || item.issuer);
  const talks: Talk[] = list(raw.talks)
    .map((item) => ({
      id: str(item.id) || createId(),
      title: str(item.title).trim(),
      event: str(item.event).trim(),
      location: str(item.location).trim(),
      year: str(item.year).trim(),
    }))
    .filter((item) => item.title || item.event);
  const teaching: Teaching[] = list(raw.teaching)
    .map((item) => ({
      id: str(item.id) || createId(),
      course: str(item.course).trim(),
      role: str(item.role).trim(),
      institution: str(item.institution).trim(),
      year: str(item.year).trim(),
    }))
    .filter((item) => item.course || item.role);
  const links: ResumeLink[] = list(raw.links)
    .map((item) => ({ id: str(item.id) || createId(), label: str(item.label).trim(), url: str(item.url).trim() }))
    .filter((item) => item.url)
    .slice(0, 8);
  const skills = Array.isArray(raw.skills)
    ? raw.skills.filter((skill): skill is string => typeof skill === 'string' && skill.trim() !== '').map((skill) => skill.trim())
    : [];

  return {
    templateId: str(raw.templateId) || DEFAULT_TEMPLATE_ID,
    design: sanitizeDesign(raw.design),
    fullName: str(raw.fullName),
    title: str(raw.title),
    email: str(raw.email),
    phone: str(raw.phone),
    location: str(raw.location),
    website: str(raw.website),
    linkedin: str(raw.linkedin),
    links,
    ...(sanitizePhoto(raw.photo) ? { photo: sanitizePhoto(raw.photo) } : {}),
    summary: str(raw.summary),
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
