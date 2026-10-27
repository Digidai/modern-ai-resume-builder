// Dev/build helper: shortens a role example step by step so it fits one A4 page in every template.
// Each level applies all earlier steps too; the least important content goes first (older roles'
// later bullets, extra projects, long skill lists), never the summary or the dates.

/** @param {string} description */
const bullets = (description) => description.split('\n').filter((line) => line.trim());

/** @param {any} e @param {number} max */
const capBullets = (e, max) => {
  const lines = bullets(e.description);
  return lines.length > max ? { ...e, description: lines.slice(0, max).join('\n') } : e;
};

/** @param {string[]} skills @param {number} groups @param {number} items */
const capSkills = (skills, groups, items) =>
  skills.slice(0, groups).map((s) => {
    const match = /^([^:]{1,40}):\s*(.+)$/.exec(s);
    if (!match) return s;
    const parts = match[2].split(/\s*,\s*(?![^()]*\))/);
    return parts.length > items ? `${match[1]}: ${parts.slice(0, items).join(', ')}` : s;
  });

const STEPS = [
  (x) => ({ ...x, skills: capSkills(x.skills, 4, 6) }),
  (x) => ({ ...x, experience: x.experience.map((e, i) => (i >= 2 ? capBullets(e, 2) : e)) }),
  (x) => ({ ...x, projects: (x.projects ?? []).slice(0, 1) }),
  (x) => ({ ...x, experience: x.experience.map((e, i) => (i === 1 ? capBullets(e, 3) : e)) }),
  (x) => ({ ...x, experience: x.experience.map((e, i) => (i === 0 ? capBullets(e, 4) : e)) }),
  (x) => ({ ...x, experience: x.experience.map((e, i) => (i >= 2 ? capBullets(e, 1) : e)) }),
  (x) => ({ ...x, skills: capSkills(x.skills, 4, 5) }),
  (x) => (x.experience.length >= 2 ? { ...x, projects: [] } : x),
  (x) => ({ ...x, experience: x.experience.map((e, i) => (i === 1 ? capBullets(e, 2) : e)) }),
  (x) => ({ ...x, skills: capSkills(x.skills, 3, 5) }),
  (x) => ({ ...x, experience: x.experience.map((e, i) => (i === 0 ? capBullets(e, 3) : e)) }),
  (x) => ({ ...x, education: x.education.slice(0, 1) }),
  (x) => ({ ...x, experience: x.experience.map((e, i) => (i >= 1 ? capBullets(e, 1) : e)) }),
];

export const TRIM_LEVELS = STEPS.length;

/** The example with the first `level` trimming steps applied. */
export const trimExample = (example, level) => STEPS.slice(0, level).reduce((x, step) => step(x), example);
