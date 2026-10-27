/**
 * Centralized template configuration
 * Single source of truth for all template-related constants
 */

export interface TemplateConfig {
  id: string;
  name: string;
  /** One-line summary shown in the template picker. */
  description: string;
  /** Single column, standard headings, real text in reading order: safe for applicant tracking systems. */
  atsFriendly: boolean;
  /** Whether the template handles its own full-bleed layout */
  isFullBleed: boolean;
}

/** Ordered for the picker: proven, ATS-friendly classics first, then two-column and expressive designs. */
const TEMPLATE_CATALOG = [
  { id: 'classic', name: 'Classic', description: "Jake's-style LaTeX classic: small caps and hairline rules", atsFriendly: true, isFullBleed: true },
  { id: 'modern', name: 'Modern', description: "Clean single column with accent headings and rules", atsFriendly: true, isFullBleed: false },
  { id: 'ivy', name: 'Ivy', description: "Harvard-style Times layout with centered headings", atsFriendly: true, isFullBleed: true },
  { id: 'banking', name: 'Ledger', description: "moderncv banking: accent name, bold dates on the right", atsFriendly: true, isFullBleed: true },
  { id: 'vanguard', name: 'Vanguard', description: "Bold display name, accent-led headings with line rules", atsFriendly: true, isFullBleed: true },
  { id: 'timeline', name: 'Timeline', description: "Clean accent layout with a dated career timeline", atsFriendly: true, isFullBleed: true },
  { id: 'executive', name: 'Executive', description: "Centered executive layout with serif headings", atsFriendly: true, isFullBleed: false },
  { id: 'compact', name: 'Compact', description: "Dense single column that fits long histories", atsFriendly: true, isFullBleed: false },
  { id: 'academic', name: 'Academic', description: "Scholarly CV with small-caps headings and rules", atsFriendly: true, isFullBleed: false },
  { id: 'tech', name: 'Tech', description: "Developer style: mono headings and tags, sans body", atsFriendly: true, isFullBleed: false },
  { id: 'silk', name: 'Silk', description: "Elegant Garamond serif with centered hairline headings", atsFriendly: true, isFullBleed: true },
  { id: 'lateral', name: 'Lateral', description: "Calm side-label grid with one quiet accent rule", atsFriendly: true, isFullBleed: true },
  { id: 'opal', name: 'Opal', description: "Soft, centered layout with an accent timeline", atsFriendly: true, isFullBleed: true },
  { id: 'minimalist', name: 'Minimalist', description: "Quiet serif header with a left date gutter", atsFriendly: false, isFullBleed: false },
  { id: 'duo', name: 'Duo', description: "Two columns with an airy display name", atsFriendly: false, isFullBleed: true },
  { id: 'sidebar', name: 'Sidebar', description: "Dark accent sidebar beside a timeline main column", atsFriendly: false, isFullBleed: true },
  { id: 'creative', name: 'Creative', description: "Bold accent header band with a tinted sidebar", atsFriendly: false, isFullBleed: true },
  { id: 'professional', name: 'Professional', description: "Dark header band with a tinted skills sidebar", atsFriendly: false, isFullBleed: true },
  { id: 'elegant', name: 'Elegant', description: "Playfair serif headings, refined two-column layout", atsFriendly: false, isFullBleed: false },
  { id: 'swiss', name: 'Swiss', description: "Bold grid with a solid name block", atsFriendly: false, isFullBleed: false },
  { id: 'berlin', name: 'Berlin', description: "Oversized name, strict rules, black and white", atsFriendly: false, isFullBleed: true },
  { id: 'iron', name: 'Iron', description: "Bold black header bar with heavy block labels", atsFriendly: false, isFullBleed: true },
  { id: 'ginto', name: 'Ginto', description: "Numbered sections, big name, timeline dots", atsFriendly: false, isFullBleed: true },
  { id: 'symmetry', name: 'Symmetry', description: "Centered serif layout with hairline dividers", atsFriendly: false, isFullBleed: true },
  { id: 'path', name: 'Path', description: "Timeline career path with a skills sidebar", atsFriendly: false, isFullBleed: true },
  { id: 'wireframe', name: 'Wireframe', description: "Blueprint frame with mono labels and dot grid", atsFriendly: false, isFullBleed: true },
  { id: 'quartz', name: 'Quartz', description: "Framed two-panel grid with mono labels", atsFriendly: false, isFullBleed: true },
  { id: 'bronx', name: 'Bronx', description: "Poster-size name, sidebar and date tags", atsFriendly: false, isFullBleed: true },
  { id: 'paper', name: 'Paper', description: "Newspaper masthead with a Playfair name and drop cap", atsFriendly: false, isFullBleed: true },
  { id: 'moda', name: 'Moda', description: "Fashion-editorial masthead with a skills sidebar", atsFriendly: false, isFullBleed: true },
  { id: 'noir', name: 'Noir', description: "Dark editorial layout with a light Raleway name", atsFriendly: false, isFullBleed: true },
  { id: 'mono', name: 'Mono', description: "Dark code-editor resume set in JetBrains Mono", atsFriendly: false, isFullBleed: true },
  { id: 'pop', name: 'Pop', description: "Playful rounded cards with two-tone accent pills", atsFriendly: false, isFullBleed: true },
  { id: 'cast', name: 'Cast', description: "Screenplay-style resume with scene headings", atsFriendly: false, isFullBleed: true },
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
