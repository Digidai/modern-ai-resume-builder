/**
 * Centralized template configuration
 * Single source of truth for all template-related constants
 */

export interface TemplateConfig {
  id: string;
  name: string;
  color: string;
  /** Whether the template handles its own full-bleed layout */
  isFullBleed: boolean;
  /** Whether vector PDF export is supported */
  supportsPdfVector: boolean;
}

/**
 * All available resume templates with their configurations
 */
export const TEMPLATES: TemplateConfig[] = [
  { id: 'modern', name: 'Modern', color: 'bg-indigo-500', isFullBleed: false, supportsPdfVector: true },
  { id: 'minimalist', name: 'Minimalist', color: 'bg-slate-200', isFullBleed: false, supportsPdfVector: true },
  { id: 'sidebar', name: 'Sidebar', color: 'bg-slate-800', isFullBleed: true, supportsPdfVector: true },
  { id: 'executive', name: 'Executive', color: 'bg-slate-600', isFullBleed: false, supportsPdfVector: false },
  { id: 'creative', name: 'Creative', color: 'bg-emerald-600', isFullBleed: true, supportsPdfVector: false },
  { id: 'compact', name: 'Compact', color: 'bg-blue-400', isFullBleed: false, supportsPdfVector: false },
  { id: 'tech', name: 'Tech', color: 'bg-gray-900', isFullBleed: false, supportsPdfVector: false },
  { id: 'professional', name: 'Professional', color: 'bg-blue-800', isFullBleed: true, supportsPdfVector: false },
  { id: 'academic', name: 'Academic', color: 'bg-slate-100 border border-slate-400 !text-slate-800', isFullBleed: false, supportsPdfVector: false },
  { id: 'elegant', name: 'Elegant', color: 'bg-stone-200', isFullBleed: false, supportsPdfVector: false },
  { id: 'swiss', name: 'Swiss', color: 'bg-slate-900 border-2 border-white', isFullBleed: false, supportsPdfVector: false },
  { id: 'opal', name: 'Opal', color: 'bg-slate-50', isFullBleed: true, supportsPdfVector: false },
  { id: 'wireframe', name: 'Wireframe', color: 'bg-white border border-slate-300', isFullBleed: true, supportsPdfVector: false },
  { id: 'berlin', name: 'Berlin', color: 'bg-white border-t-4 border-black', isFullBleed: true, supportsPdfVector: false },
  { id: 'lateral', name: 'Lateral', color: 'bg-white', isFullBleed: true, supportsPdfVector: false },
  { id: 'iron', name: 'Iron', color: 'bg-black', isFullBleed: true, supportsPdfVector: false },
  { id: 'ginto', name: 'Ginto', color: 'bg-white', isFullBleed: true, supportsPdfVector: false },
  { id: 'symmetry', name: 'Symmetry', color: 'bg-slate-50', isFullBleed: true, supportsPdfVector: false },
  { id: 'bronx', name: 'Bronx', color: 'bg-white', isFullBleed: true, supportsPdfVector: false },
  { id: 'path', name: 'Path', color: 'bg-white', isFullBleed: true, supportsPdfVector: false },
  { id: 'quartz', name: 'Quartz', color: 'bg-white border border-slate-900', isFullBleed: true, supportsPdfVector: false },
  { id: 'silk', name: 'Silk', color: 'bg-stone-50', isFullBleed: true, supportsPdfVector: false },
  { id: 'mono', name: 'Mono', color: 'bg-slate-900', isFullBleed: true, supportsPdfVector: false },
  { id: 'pop', name: 'Pop', color: 'bg-gradient-to-r from-indigo-100 to-pink-100', isFullBleed: true, supportsPdfVector: false },
  { id: 'noir', name: 'Noir', color: 'bg-zinc-900', isFullBleed: true, supportsPdfVector: false },
  { id: 'paper', name: 'Paper', color: 'bg-[#fffef8] border border-slate-300', isFullBleed: true, supportsPdfVector: false },
  { id: 'cast', name: 'Cast', color: 'bg-[#fafafa] font-mono', isFullBleed: true, supportsPdfVector: false },
  { id: 'moda', name: 'Moda', color: 'bg-white', isFullBleed: true, supportsPdfVector: false },
];

/** Template IDs that support full-bleed layout */
export const FULL_BLEED_TEMPLATE_IDS = TEMPLATES
  .filter(t => t.isFullBleed)
  .map(t => t.id);

/** Template IDs that support vector PDF export */
export const PDF_VECTOR_TEMPLATE_IDS = TEMPLATES
  .filter(t => t.supportsPdfVector)
  .map(t => t.id);

/** Default template ID */
export const DEFAULT_TEMPLATE_ID = 'modern';

/**
 * Get template config by ID
 */
export const getTemplateById = (id: string): TemplateConfig | undefined => {
  return TEMPLATES.find(t => t.id === id);
};

/**
 * Check if a template is full-bleed
 */
export const isFullBleedTemplate = (templateId: string): boolean => {
  return FULL_BLEED_TEMPLATE_IDS.includes(templateId);
};

/**
 * Check if a template supports vector PDF export
 */
export const supportsPdfVector = (templateId: string): boolean => {
  return PDF_VECTOR_TEMPLATE_IDS.includes(templateId);
};
