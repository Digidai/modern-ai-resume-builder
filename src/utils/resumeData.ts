import { DEFAULT_TEMPLATE_ID } from '../constants/templates';
import { DEFAULT_DESIGN, type Education, type Experience, type Project, type ResumeData, type ResumeDesign } from '../types';

const str = (value: unknown): string => (typeof value === 'string' ? value : '');
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

/**
 * Coerces untrusted JSON (an imported backup) into a well-formed ResumeData, so templates
 * never see missing fields or non-string values. Returns null if it doesn't look like a resume.
 */
export const sanitizeResumeData = (input: unknown): ResumeData | null => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const raw = input as Record<string, unknown>;
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
    summary: str(raw.summary),
    experience,
    education,
    skills,
    projects,
  };
};
