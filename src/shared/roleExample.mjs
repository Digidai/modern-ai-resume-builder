// Example resumes per job title (data in src/data/roles/*.json).
// Shared by the job page (src/components/TemplateSelector.tsx), the agent API (worker/agent.ts) and
// scripts/seo-postbuild.mjs, so the pre-rendered text, the meta description and the hydrated page match.

/**
 * @typedef {{ company: string, role: string, location?: string, startDate: string, endDate: string, isCurrent: boolean, description: string }} ExampleExperience
 * @typedef {{ school: string, degree: string, startDate: string, endDate: string }} ExampleEducation
 * @typedef {{ name: string, link: string, description: string }} ExampleProject
 * @typedef {{ summary: string, experience: ExampleExperience[], education: ExampleEducation[], projects: ExampleProject[], skills: string[], fit?: Record<string, number> }} RoleExample
 * @typedef {{ family: string, guide: unknown, titles: Record<string, RoleExample> }} RoleFile
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2021-03" → "Mar 2021". */
export const formatMonth = (value) => {
  const match = /^(\d{4})-(\d{1,2})/.exec(String(value || '').trim());
  if (!match) return String(value || '').trim();
  return `${MONTHS[Number(match[2]) - 1] ?? ''} ${match[1]}`.trim();
};

/** @param {{ startDate: string, endDate: string, isCurrent?: boolean }} item */
export const formatRange = (item) => {
  const from = formatMonth(item.startDate);
  const to = item.isCurrent ? 'Present' : formatMonth(item.endDate);
  return from && to ? `${from} – ${to}` : from || to;
};

/** "- a\n- b" → ["a", "b"]; plain lines are kept as-is. */
export const toBullets = (description) =>
  String(description || '')
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[-*•]\s+)/, '').trim())
    .filter(Boolean);

/** Whole years between the earliest start date and now (or the latest end date). */
export const yearsOfExperience = (example, now = new Date()) => {
  const starts = example.experience.map((e) => e.startDate).filter((d) => /^\d{4}-\d{2}/.test(d)).sort();
  if (!starts.length) return 0;
  const [y, m] = starts[0].split('-').map(Number);
  return Math.max(0, Math.floor((now.getFullYear() * 12 + now.getMonth() - (y * 12 + m - 1)) / 12));
};

/** Page title for a job page, using the longest form that stays within ~60 characters. */
export const buildJobPageTitle = (title) => {
  for (const suffix of [' Resume Example & Templates | ModernCV', ' Resume Example | ModernCV']) {
    if ((title + suffix).length <= 60) return title + suffix;
  }
  return `${title} Resume | ModernCV`;
};

/** Unique, specific meta description for a job page. */
export const describeExample = (title, example, templateCount) => {
  const head = `${title} resume example: `;
  const tail = ` Start from it in ${templateCount} free templates.`;
  const lead = (example.summary.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? example.summary).trim();
  if (head.length + lead.length + tail.length <= 160) return `${head}${lead}${tail}`;
  if (head.length + lead.length <= 160) return `${head}${lead}`;
  // Too long: end at the last clause break (comma or semicolon) that fits, else at a word boundary.
  const room = lead.slice(0, 159 - head.length);
  const clause = room.search(/[,;][^,;]*$/);
  if (clause > 50) return `${head}${room.slice(0, clause)}.`;
  return `${head}${room.replace(/[\s,;:]+\S*$/, '')}…`;
};

/** Plain-text version of the example (for "Copy text" and llms-full). */
export const exampleToText = (title, example) => {
  const lines = [title.toUpperCase(), '', 'SUMMARY', example.summary, '', 'EXPERIENCE'];
  for (const e of example.experience) {
    lines.push(`${e.role}, ${e.company}${e.location ? ` (${e.location})` : ''} | ${formatRange(e)}`);
    for (const b of toBullets(e.description)) lines.push(`- ${b}`);
    lines.push('');
  }
  if (example.projects?.length) {
    lines.push('PROJECTS');
    for (const p of example.projects) lines.push(`${p.name}${p.link ? ` (${p.link})` : ''}: ${p.description}`);
    lines.push('');
  }
  if (example.education.length) {
    lines.push('EDUCATION');
    for (const ed of example.education) lines.push(`${ed.degree}, ${ed.school} | ${formatRange(ed)}`);
    lines.push('');
  }
  if (example.skills.length) lines.push('SKILLS', ...example.skills);
  return lines.join('\n').trim();
};

const lowerSlug = (value) =>
  String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');

/**
 * Full resume data for previews and "Start from this example": the example plus a fictional person.
 * @param {{ title: string, fullName: string, example: RoleExample, makeId: () => string }} input
 */
export const exampleToResume = ({ title, fullName, example, makeId }) => {
  const [first = 'alex', ...rest] = fullName.split(' ');
  const last = rest.join('') || 'sample';
  const handle = `${lowerSlug(first)}${lowerSlug(last)}`;
  return {
    fullName,
    title,
    email: `${lowerSlug(first)}.${lowerSlug(last)}@example.com`,
    phone: '+1 (555) 014-2387',
    location: example.experience.find((e) => e.location)?.location ?? '',
    website: '',
    linkedin: `linkedin.com/in/${handle}`,
    links: [],
    summary: example.summary,
    experience: example.experience.map((e) => ({
      id: makeId(),
      company: e.company,
      role: e.role,
      startDate: e.startDate,
      endDate: e.isCurrent ? '' : e.endDate,
      isCurrent: !!e.isCurrent,
      description: e.description,
    })),
    education: example.education.map((ed) => ({ id: makeId(), ...ed })),
    projects: (example.projects ?? []).map((p) => ({ id: makeId(), ...p })),
    skills: [...example.skills],
  };
};
