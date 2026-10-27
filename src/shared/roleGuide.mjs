// Role-specific resume guidance for /resume_tmpl/:slug pages.
// Shared by the React page and scripts/seo-postbuild.mjs so the prerendered HTML, the
// FAQPage structured data and the hydrated page always say the same thing.

/**
 * @typedef {{ focus: string, skills: string[], sections: string[], metrics: string[], bullets: string[], tips: string[], templates: string[] }} CategoryGuide
 * @typedef {{ pattern: string, length: string, advice: string, summary: string }} LevelGuide
 * @typedef {{ categories: Record<string, CategoryGuide>, fallback: CategoryGuide, levels: Record<string, LevelGuide> }} RoleGuideData
 * @typedef {{ id: string, name: string, description: string, atsFriendly: boolean }} TemplateSummary
 */

/** Most specific first: "Senior Manager" is a leadership role, "Associate Director" too. */
const LEVEL_ORDER = ['leader', 'senior', 'early'];

/** @param {string} title @param {RoleGuideData} data */
export const getRoleLevel = (title, data) =>
  LEVEL_ORDER.find((level) => new RegExp(data.levels[level].pattern, 'i').test(title)) ?? 'mid';

const list = (items) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : items[0] ?? '');

/**
 * @param {{ title: string, category?: string, data: RoleGuideData, templates: readonly TemplateSummary[] }} input
 */
export const buildRoleGuide = ({ title, category, data, templates }) => {
  const guide = (category && data.categories[category]) || data.fallback;
  const levelKey = getRoleLevel(title, data);
  const level = data.levels[levelKey];
  const recommended = guide.templates
    .map((id) => templates.find((t) => t.id === id))
    .filter(/** @returns {t is TemplateSummary} */ (t) => !!t);
  const topSkills = guide.skills.slice(0, 6);
  const sections = levelKey === 'early' ? ['Summary', 'Education', ...guide.sections.filter((s) => s !== 'Summary' && s !== 'Education')] : guide.sections;

  const faqs = [
    {
      question: `What should a ${title} resume include?`,
      answer: `A ${title} resume should show ${guide.focus}. Use these sections in this order: ${list(sections)}. ${level.advice}`,
    },
    {
      question: `What is the best resume template for a ${title}?`,
      answer: `${list(recommended.map((t) => t.name))} work well for ${title} roles. ${
        recommended.some((t) => t.atsFriendly)
          ? 'They are single-column with standard headings, so applicant tracking systems (ATS) parse them reliably.'
          : 'Choose a single-column template when you apply through an applicant tracking system (ATS).'
      }`,
    },
    {
      question: `How long should a ${title} resume be?`,
      answer: level.length,
    },
    {
      question: `Which skills should a ${title} put on a resume?`,
      answer: `Prioritize the skills named in the job posting. Common ones for ${title} roles are ${list(topSkills)}.`,
    },
    {
      question: `How do I write strong ${title} resume bullet points?`,
      answer: `Start with an action verb, say what you did, and end with a measurable result such as ${list(guide.metrics.slice(0, 3))}. For example: "${guide.bullets[0]}."`,
    },
  ];

  return {
    level: levelKey,
    intro: `A strong ${title} resume shows ${guide.focus}.`,
    summaryTip: level.summary,
    length: level.length,
    advice: level.advice,
    sections,
    skills: guide.skills,
    metrics: guide.metrics,
    bullets: guide.bullets,
    tips: guide.tips,
    recommended,
    faqs,
  };
};
