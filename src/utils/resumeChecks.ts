import type { ResumeData } from '../types';
import { getEmailError, getPhoneError } from './validation';

// Quick, local checks of a resume's content: no AI, no network, so they update as you type.

export interface ResumeCheck {
  id: string;
  message: string;
  /** Editor tab that fixes it. */
  tab: 'profile' | 'experience' | 'skills' | 'design';
  /** Entry card to open, as `${list}:${id}`. */
  item?: string;
}

/** About two printed lines of body text; a longer bullet reads as a paragraph. */
export const LONG_BULLET_CHARS = 200;
// CJK and full-width characters print about twice as wide as Latin ones.
const WIDE = /[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6]/g;
const printWidth = (line: string) => line.length + (line.match(WIDE)?.length ?? 0);
const MONTH = /^\d{4}-\d{2}$/;

/** Skills listed: a group such as "Languages: Go, Python, SQL" counts each skill after its label. */
const skillCount = (skills: string[]) =>
  skills.reduce((total, entry) => total + entry.slice(entry.search(/[:：]/) + 1).split(/[,;，、；]/).filter((skill) => skill.trim()).length, 0);

const bullets = (text: string) =>
  text
    .split('\n')
    .map((line) => line.replace(/^\s*[-•*–]\s*/, '').trim())
    .filter(Boolean);

export const checkResume = (data: ResumeData, pages?: { count: number; max: number } | null): ResumeCheck[] => {
  const checks: ResumeCheck[] = [];
  const add = (check: ResumeCheck) => checks.push(check);

  if (!data.fullName.trim()) add({ id: 'name', message: 'Add your name.', tab: 'profile' });
  if (!data.email.trim() && !data.phone.trim()) add({ id: 'contact', message: 'Add an email or phone number so recruiters can reach you.', tab: 'profile' });
  else if (getEmailError(data.email) || getPhoneError(data.phone)) add({ id: 'contact-format', message: 'Fix the email or phone format.', tab: 'profile' });
  if (/@example\.(com|org)$/i.test(data.email.trim())) add({ id: 'sample-email', message: 'Replace the sample email with your own.', tab: 'profile' });
  if (!data.summary.trim()) add({ id: 'summary', message: 'Add a two- or three-sentence summary.', tab: 'profile' });

  if (data.experience.length === 0 && data.education.length === 0) {
    add({ id: 'no-history', message: 'Add your work experience or education.', tab: 'experience' });
  }
  data.experience.forEach((exp, index) => {
    const name = exp.role.trim() || exp.company.trim() || 'a position';
    const item = `experience:${exp.id}`;
    if (!exp.startDate) add({ id: `start-${exp.id}`, message: `Add a start date to ${name}.`, tab: 'experience', item });
    if (!exp.isCurrent && !exp.endDate) add({ id: `end-${exp.id}`, message: `Add an end date to ${name}, or mark it as current.`, tab: 'experience', item });
    if (!exp.isCurrent && MONTH.test(exp.startDate) && MONTH.test(exp.endDate) && exp.endDate < exp.startDate) {
      add({ id: `order-${exp.id}`, message: `${name} ends before it starts.`, tab: 'experience', item });
    }
    const lines = bullets(exp.description);
    if (lines.length === 0) add({ id: `empty-${exp.id}`, message: `Describe what you achieved at ${name}.`, tab: 'experience', item });
    // Recent roles carry the numbers; an older role with a line or two needs none.
    else if ((index === 0 || lines.length >= 3) && !lines.some((line) => /\d/.test(line))) {
      add({ id: `numbers-${exp.id}`, message: `Add a number to ${name}: a %, an amount, a team size or a count.`, tab: 'experience', item });
    }
    const long = lines.filter((line) => printWidth(line) > LONG_BULLET_CHARS).length;
    if (long) add({ id: `long-${exp.id}`, message: `Shorten ${long === 1 ? 'a bullet' : `${long} bullets`} in ${name} to two lines or less.`, tab: 'experience', item });
  });
  for (const edu of data.education) {
    if (MONTH.test(edu.startDate) && MONTH.test(edu.endDate) && edu.endDate < edu.startDate) {
      add({ id: `order-${edu.id}`, message: `${edu.school.trim() || 'An education entry'} ends before it starts.`, tab: 'experience', item: `education:${edu.id}` });
    }
  }

  if (skillCount(data.skills) < 3) add({ id: 'skills', message: 'List at least three skills; ATS searches match on them.', tab: 'skills' });

  if (pages && pages.count > pages.max) {
    add({ id: 'pages', message: `It runs to ${pages.count} pages; aim for ${pages.max === 1 ? 'one' : pages.max}. Shorten older roles or use Fit on the Template tab.`, tab: 'design' });
  }
  return checks;
};
