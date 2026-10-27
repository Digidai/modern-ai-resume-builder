/**
 * Centralized template configuration
 * Single source of truth for all template-related constants
 */

export interface TemplateConfig {
  id: string;
  name: string;
  /** One-line summary shown in the template picker. */
  description: string;
  /** Who the template suits, shown on its detail page. */
  bestFor: string;
  /** Single column, standard headings, real text in reading order: safe for applicant tracking systems. */
  atsFriendly: boolean;
  /** Whether the template handles its own full-bleed layout */
  isFullBleed: boolean;
}

/** Ordered for the picker: proven, ATS-friendly classics first, then two-column and expressive designs. */
const TEMPLATE_CATALOG = [
  { id: 'classic', name: 'Classic', description: "Jake's-style LaTeX classic: small caps and hairline rules", bestFor: 'Engineers, students and anyone applying through ATS portals', atsFriendly: true, isFullBleed: true },
  { id: 'modern', name: 'Modern', description: "Clean single column with accent headings and rules", bestFor: 'Tech, product and business roles that want a clean, current look', atsFriendly: true, isFullBleed: false },
  { id: 'ivy', name: 'Ivy', description: "Harvard-style Times layout with centered headings", bestFor: 'Finance, law, consulting and new graduates', atsFriendly: true, isFullBleed: true },
  { id: 'banking', name: 'Ledger', description: "moderncv banking: accent name, bold dates on the right", bestFor: 'Banking, finance and corporate roles', atsFriendly: true, isFullBleed: true },
  { id: 'vanguard', name: 'Vanguard', description: "Bold display name, accent-led headings with line rules", bestFor: 'Experienced professionals who want a confident header', atsFriendly: true, isFullBleed: true },
  { id: 'timeline', name: 'Timeline', description: "Clean accent layout with a dated career timeline", bestFor: 'Career progressions and frequent promotions', atsFriendly: true, isFullBleed: true },
  { id: 'executive', name: 'Executive', description: "Centered executive layout with serif headings", bestFor: 'Directors, VPs and senior leadership', atsFriendly: true, isFullBleed: false },
  { id: 'compact', name: 'Compact', description: "Dense single column that fits long histories", bestFor: 'Long careers that need to fit on one page', atsFriendly: true, isFullBleed: false },
  { id: 'academic', name: 'Academic', description: "Scholarly CV with small-caps headings and rules", bestFor: 'Researchers, teachers and academic CVs', atsFriendly: true, isFullBleed: false },
  { id: 'tech', name: 'Tech', description: "Developer style: mono headings and tags, sans body", bestFor: 'Software engineers and developers', atsFriendly: true, isFullBleed: false },
  { id: 'silk', name: 'Silk', description: "Elegant Garamond serif with centered hairline headings", bestFor: 'Editorial, communications and humanities roles', atsFriendly: true, isFullBleed: true },
  { id: 'lateral', name: 'Lateral', description: "Calm side-label grid with one quiet accent rule", bestFor: 'Consultants and analysts who like a structured grid', atsFriendly: true, isFullBleed: true },
  { id: 'opal', name: 'Opal', description: "Soft, centered layout with an accent timeline", bestFor: 'Designers, marketers and people-facing roles', atsFriendly: true, isFullBleed: true },
  { id: 'meridian', name: 'Meridian', description: "Modern serif with a hairline date rail on the right", bestFor: 'Law, policy, consulting and finance professionals', atsFriendly: true, isFullBleed: true },
  { id: 'keystone', name: 'Keystone', description: "Corporate layout with tinted heading bands", bestFor: 'Operations, management and corporate roles', atsFriendly: true, isFullBleed: true },
  { id: 'vital', name: 'Vital', description: "Clean clinical layout with a credentials block", bestFor: 'Nurses, clinicians and other licensed professionals', atsFriendly: true, isFullBleed: true },
  { id: 'minimalist', name: 'Minimalist', description: "Quiet serif header with a left date gutter", bestFor: 'Senior professionals with a quiet, serif style', atsFriendly: false, isFullBleed: false },
  { id: 'duo', name: 'Duo', description: "Two columns with an airy display name", bestFor: 'Designers and engineers who want a two-column summary', atsFriendly: false, isFullBleed: true },
  { id: 'altitude', name: 'Altitude', description: "AltaCV-style two columns with outlined skill tags", bestFor: 'Engineers and researchers who want a lively two-column page', atsFriendly: false, isFullBleed: true },
  { id: 'halo', name: 'Halo', description: "Soft gradient header, initials avatar, card sidebar", bestFor: 'Customer-facing, education and people roles', atsFriendly: false, isFullBleed: true },
  { id: 'prism', name: 'Prism', description: "Angled accent header with skewed date tags", bestFor: 'Sales, marketing and startup roles that want energy', atsFriendly: false, isFullBleed: true },
  { id: 'sidebar', name: 'Sidebar', description: "Dark accent sidebar beside a timeline main column", bestFor: 'Tech and product roles with many skills', atsFriendly: false, isFullBleed: true },
  { id: 'creative', name: 'Creative', description: "Bold accent header band with a tinted sidebar", bestFor: 'Marketing, design and media roles', atsFriendly: false, isFullBleed: true },
  { id: 'professional', name: 'Professional', description: "Dark header band with a tinted skills sidebar", bestFor: 'Corporate roles that need a strong header', atsFriendly: false, isFullBleed: true },
  { id: 'elegant', name: 'Elegant', description: "Playfair serif headings, refined two-column layout", bestFor: 'Hospitality, luxury and client-facing roles', atsFriendly: false, isFullBleed: false },
  { id: 'swiss', name: 'Swiss', description: "Bold grid with a solid name block", bestFor: 'Designers and architects', atsFriendly: false, isFullBleed: false },
  { id: 'berlin', name: 'Berlin', description: "Oversized name, strict rules, black and white", bestFor: 'Designers who want a bold typographic statement', atsFriendly: false, isFullBleed: true },
  { id: 'iron', name: 'Iron', description: "Bold black header bar with heavy block labels", bestFor: 'Engineering leads and operations roles', atsFriendly: false, isFullBleed: true },
  { id: 'ginto', name: 'Ginto', description: "Numbered sections, big name, timeline dots", bestFor: 'Startup and product roles', atsFriendly: false, isFullBleed: true },
  { id: 'symmetry', name: 'Symmetry', description: "Centered serif layout with hairline dividers", bestFor: 'Arts, culture and nonprofit roles', atsFriendly: false, isFullBleed: true },
  { id: 'path', name: 'Path', description: "Timeline career path with a skills sidebar", bestFor: 'Career changers who want to show progression', atsFriendly: false, isFullBleed: true },
  { id: 'wireframe', name: 'Wireframe', description: "Blueprint frame with mono labels and dot grid", bestFor: 'UX designers and front-end developers', atsFriendly: false, isFullBleed: true },
  { id: 'quartz', name: 'Quartz', description: "Framed two-panel grid with mono labels", bestFor: 'Technical roles with a structured, framed look', atsFriendly: false, isFullBleed: true },
  { id: 'bronx', name: 'Bronx', description: "Poster-size name, sidebar and date tags", bestFor: 'Creatives who want a poster-style header', atsFriendly: false, isFullBleed: true },
  { id: 'paper', name: 'Paper', description: "Newspaper masthead with a Playfair name and drop cap", bestFor: 'Writers, editors and journalists', atsFriendly: false, isFullBleed: true },
  { id: 'moda', name: 'Moda', description: "Fashion-editorial masthead with a skills sidebar", bestFor: 'Fashion, beauty and creative industries', atsFriendly: false, isFullBleed: true },
  { id: 'noir', name: 'Noir', description: "Dark editorial layout with a light Raleway name", bestFor: 'Creative directors and media roles', atsFriendly: false, isFullBleed: true },
  { id: 'mono', name: 'Mono', description: "Dark code-editor resume set in JetBrains Mono", bestFor: 'Developers who like a code-editor aesthetic', atsFriendly: false, isFullBleed: true },
  { id: 'pop', name: 'Pop', description: "Playful rounded cards with two-tone accent pills", bestFor: 'Early-career, education and playful brands', atsFriendly: false, isFullBleed: true },
  { id: 'cast', name: 'Cast', description: "Screenplay-style resume with scene headings", bestFor: 'Film, theatre and entertainment roles', atsFriendly: false, isFullBleed: true },
] as const satisfies readonly TemplateConfig[];

export type TemplateId = (typeof TEMPLATE_CATALOG)[number]['id'];

/**
 * All available resume templates with their configurations
 */
export const TEMPLATES: ReadonlyArray<TemplateConfig & { id: TemplateId }> = TEMPLATE_CATALOG;

/** All template IDs */
export const TEMPLATE_IDS: TemplateId[] = TEMPLATES.map((template) => template.id) as TemplateId[];

/** Template IDs that support full-bleed layout */
export const FULL_BLEED_TEMPLATE_IDS: TemplateId[] = TEMPLATES
  .filter((template) => template.isFullBleed)
  .map((template) => template.id) as TemplateId[];

/** Default template ID */
export const DEFAULT_TEMPLATE_ID: TemplateId = 'modern';

/**
 * Get template config by ID
 */
export const getTemplateById = (id: string): TemplateConfig | undefined => {
  return TEMPLATES.find((template) => template.id === id);
};

/**
 * Check if a template is full-bleed
 */
export const isFullBleedTemplate = (templateId: string): boolean => {
  return FULL_BLEED_TEMPLATE_IDS.includes(templateId as TemplateId);
};
