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
  /** Shows the resume photo (initials when there is none). */
  photo?: boolean;
  /** Shows the Publications section (`data.publications`). */
  publications?: boolean;
  /** Shows Grants and awards (`data.awards`) without the other academic sections. Academic templates show it too. */
  awards?: boolean;
  /** Shows hours per week on each job (`experience[].hours`), as federal resumes require. */
  hours?: boolean;
  /** Page limit the format enforces (USAJOBS: 2); the editor and agents warn above it. */
  maxPages?: number;
}

/**
 * Ordered for the picker: proven, ATS-friendly classics first, then two-column and expressive designs.
 * The first eight are the first screen of /templates and the job pages' picker, so they share three
 * resume font families (Charis SIL, Tinos, Source Sans 3) besides the site's Inter.
 */
const TEMPLATE_CATALOG = [
  { id: 'classic', name: 'Classic', description: "Jake's-style LaTeX classic: small caps and hairline rules", bestFor: 'Engineers, students and anyone applying through ATS portals', atsFriendly: true, isFullBleed: true },
  { id: 'modern', name: 'Modern', description: "Clean single column with accent headings and rules", bestFor: 'Tech, product and business roles that want a clean, current look', atsFriendly: true, isFullBleed: false },
  { id: 'ivy', name: 'Ivy', description: "Harvard-style Times layout with centered headings", bestFor: 'Finance, law, consulting and new graduates', atsFriendly: true, isFullBleed: true },
  { id: 'timeline', name: 'Timeline', description: "Clean accent layout with a dated career timeline", bestFor: 'Career progressions and frequent promotions', atsFriendly: true, isFullBleed: true },
  { id: 'compact', name: 'Compact', description: "Dense single column that fits long histories", bestFor: 'Long careers that need to fit on one page', atsFriendly: true, isFullBleed: false },
  { id: 'wallstreet', name: 'Wall Street', description: "Investment-banking format: Times, education first, bold firms", bestFor: 'Investment banking, private equity, consulting and finance', atsFriendly: true, isFullBleed: true },
  { id: 'graduate', name: 'Graduate', description: "Education and skills first, then internships and projects", bestFor: 'Students, new graduates and interns', atsFriendly: true, isFullBleed: true, publications: true },
  { id: 'academic', name: 'Academic', description: "Scholarly CV with small-caps headings and rules", bestFor: 'Researchers, teachers and academic CVs', atsFriendly: true, isFullBleed: false, publications: true },
  { id: 'banking', name: 'Ledger', description: "moderncv banking: accent name, bold dates on the right", bestFor: 'Banking, finance and corporate roles', atsFriendly: true, isFullBleed: true },
  { id: 'vanguard', name: 'Vanguard', description: "Bold display name, accent-led headings with line rules", bestFor: 'Experienced professionals who want a confident header', atsFriendly: true, isFullBleed: true },
  { id: 'executive', name: 'Executive', description: "Centered executive layout with serif headings", bestFor: 'Directors, VPs and senior leadership', atsFriendly: true, isFullBleed: false },
  { id: 'tech', name: 'Tech', description: "Developer style: mono headings and tags, sans body", bestFor: 'Software engineers and developers', atsFriendly: true, isFullBleed: false },
  { id: 'silk', name: 'Silk', description: "Elegant Garamond serif with centered hairline headings", bestFor: 'Editorial, communications and humanities roles', atsFriendly: true, isFullBleed: true },
  { id: 'lateral', name: 'Lateral', description: "Calm side-label grid with one quiet accent rule", bestFor: 'Consultants and analysts who like a structured grid', atsFriendly: true, isFullBleed: true },
  { id: 'opal', name: 'Opal', description: "Soft, centered layout with an accent timeline", bestFor: 'Designers, marketers and people-facing roles', atsFriendly: true, isFullBleed: true },
  { id: 'meridian', name: 'Meridian', description: "Modern serif with a hairline date rail on the right", bestFor: 'Law, policy, consulting and finance professionals', atsFriendly: true, isFullBleed: true },
  { id: 'keystone', name: 'Keystone', description: "Corporate layout with tinted heading bands", bestFor: 'Operations, management and corporate roles', atsFriendly: true, isFullBleed: true },
  { id: 'vital', name: 'Vital', description: "Clean clinical layout with a credentials block", bestFor: 'Nurses, clinicians and other licensed professionals', atsFriendly: true, isFullBleed: true },
  { id: 'plain', name: 'Plain', description: "The most basic resume: black text, one column, one hairline per section", bestFor: 'Anyone who wants a plain, no-design resume that every ATS reads', atsFriendly: true, isFullBleed: true, publications: true },
  { id: 'text', name: 'Text', description: "Text only: no rules, colour or icons, just weight and white space", bestFor: 'Minimalists and conservative industries', atsFriendly: true, isFullBleed: true, publications: true },
  { id: 'scholar', name: 'Scholar', description: "Academic CV with numbered publications and a year gutter", bestFor: 'PhD students, postdocs, researchers and faculty', atsFriendly: true, isFullBleed: true, publications: true },
  { id: 'oxford', name: 'Oxford', description: "moderncv classic: grey title, accent bars and a left date column", bestFor: 'Academic CVs, European applications and research roles', atsFriendly: true, isFullBleed: true, publications: true },
  { id: 'standard', name: 'Standard', description: "McDowell/CareerCup format: Times, small caps, firm · role · dates", bestFor: 'Software engineers and tech recruiting pipelines', atsFriendly: true, isFullBleed: true },
  { id: 'lumen', name: 'Lumen', description: "billryan-style centred header with icon-led section titles", bestFor: 'Engineers and graduates who want a clean, slightly warmer page', atsFriendly: true, isFullBleed: true },
  { id: 'clarity', name: 'Clarity', description: "Clean Inter layout: caps headings over a rule, dates on the right", bestFor: 'Any role; a clear, modern default for ATS portals', atsFriendly: true, isFullBleed: true },
  { id: 'harbor', name: 'Harbor', description: "Centred serif header, headings with a trailing rule", bestFor: 'Law, finance, education and traditional employers', atsFriendly: true, isFullBleed: true },
  { id: 'metro', name: 'Metro', description: "Name left, contacts stacked right, accent-bar headings", bestFor: 'Tech, operations and business roles', atsFriendly: true, isFullBleed: true },
  { id: 'atlas', name: 'Atlas', description: "Tinted section bands, role and employer on one line", bestFor: 'Experienced professionals with many roles', atsFriendly: true, isFullBleed: true },
  { id: 'chronicle', name: 'Chronicle', description: "Garamond with dates in a left column", bestFor: 'Writers, researchers and long, steady careers', atsFriendly: true, isFullBleed: true },
  { id: 'cobalt', name: 'Cobalt', description: "Montserrat with short accent strokes under headings", bestFor: 'Marketing, sales and startup roles that still need ATS', atsFriendly: true, isFullBleed: true },
  { id: 'granite', name: 'Granite', description: "IBM Plex Serif, contacts stacked right, ruled headings", bestFor: 'Engineering, finance and operations leaders', atsFriendly: true, isFullBleed: true },
  { id: 'bedrock', name: 'Bedrock', description: "Dates in a left column, headings with a trailing rule", bestFor: 'Long careers with many dated roles', atsFriendly: true, isFullBleed: true },
  { id: 'linear', name: 'Linear', description: "LaTeX look in Latin Modern, centred header", bestFor: 'Engineers, scientists and students who like a LaTeX CV', atsFriendly: true, isFullBleed: true },
  { id: 'folio', name: 'Folio', description: "EB Garamond, centred header, ruled headings", bestFor: 'Consulting, law, finance and senior roles', atsFriendly: true, isFullBleed: true },
  { id: 'slate', name: 'Slate', description: "Lato, contacts stacked right, dates in a left column", bestFor: 'Business, marketing and project managers', atsFriendly: true, isFullBleed: true },
  { id: 'federal', name: 'Federal', description: "USAJOBS-style federal resume: MM/YYYY dates and hours per week on every job", bestFor: 'US federal government jobs applied for through USAJOBS', atsFriendly: true, isFullBleed: true, hours: true, maxPages: 2, awards: true },
  { id: 'minimalist', name: 'Minimalist', description: "Quiet serif header with a left date gutter", bestFor: 'Senior professionals with a quiet, serif style', atsFriendly: false, isFullBleed: false },
  { id: 'duo', name: 'Duo', description: "Two columns with an airy display name", bestFor: 'Designers and engineers who want a two-column summary', atsFriendly: false, isFullBleed: true },
  { id: 'altitude', name: 'Altitude', description: "AltaCV-style two columns with outlined skill tags", bestFor: 'Engineers and researchers who want a lively two-column page', atsFriendly: false, isFullBleed: true },
  { id: 'halo', name: 'Halo', description: "Soft gradient header, round photo or initials, card sidebar", bestFor: 'Customer-facing, education and people roles', atsFriendly: false, isFullBleed: true, photo: true },
  { id: 'europa', name: 'Europa', description: "Europass-style CV: photo, label column and blue rules", bestFor: 'Applications in the EU, Germany, Switzerland and the Nordics', atsFriendly: false, isFullBleed: true, photo: true },
  { id: 'tokyo', name: 'Tokyo', description: "Rirekisho-inspired ruled form with a 3×4 photo box", bestFor: 'Japanese companies and formal applications that expect a photo', atsFriendly: false, isFullBleed: true, photo: true },
  { id: 'jade', name: 'Jade', description: "Photo header with accent title bars, common in China", bestFor: 'Applications in mainland China, Hong Kong, Taiwan and Singapore', atsFriendly: false, isFullBleed: true, photo: true },
  { id: 'portrait', name: 'Portrait', description: "Round photo atop a soft tinted sidebar", bestFor: 'Hospitality, sales and customer-facing roles that use a photo', atsFriendly: false, isFullBleed: true, photo: true },
  { id: 'munich', name: 'Munich', description: "German tabular Lebenslauf: passport photo, dated rows", bestFor: 'Applications in Germany, Austria and Switzerland', atsFriendly: false, isFullBleed: true, photo: true },
  { id: 'onyx', name: 'Onyx', description: "Dark sidebar with a round photo, skills and education", bestFor: 'Sales, marketing, hospitality and customer-facing roles', atsFriendly: false, isFullBleed: true, photo: true },
  { id: 'riviera', name: 'Riviera', description: "Centered round photo above a serif name, single column", bestFor: 'Applications in France, Spain and Italy, and client-facing roles', atsFriendly: false, isFullBleed: true, photo: true },
  { id: 'summit', name: 'Summit', description: "Accent header band with a square photo, two columns", bestFor: 'Corporate, management and consulting roles that use a photo', atsFriendly: false, isFullBleed: true, photo: true },
  { id: 'seoul', name: 'Seoul', description: "Korean 이력서 layout: 3×4 photo, details grid, tabled history", bestFor: 'Applications in South Korea and Korean companies abroad', atsFriendly: false, isFullBleed: true, photo: true },
  { id: 'dubai', name: 'Dubai', description: "Gulf-style CV: gold rule, framed photo, core competencies grid", bestFor: 'Applications in the UAE, Saudi Arabia, Qatar and the wider Gulf', atsFriendly: false, isFullBleed: true, photo: true },
  { id: 'manila', name: 'Manila', description: "Square 2×2 ID photo with tinted section bars", bestFor: 'Applications in the Philippines, Indonesia, Malaysia and Vietnam', atsFriendly: false, isFullBleed: true, photo: true },
  { id: 'linen', name: 'Linen', description: "Beige minimalist: round photo, serif name, timeline", bestFor: 'Creative, education, hospitality and people-facing roles', atsFriendly: false, isFullBleed: true, photo: true },
  { id: 'banner', name: 'Banner', description: "Square photo, profile in the header, accent contact strip", bestFor: 'Any role in markets that expect a photo; a safe, widely used layout', atsFriendly: false, isFullBleed: true, photo: true },
  { id: 'wave', name: 'Wave', description: "Curved accent header with a round photo, two columns", bestFor: 'Marketing, sales, education and early-career roles', atsFriendly: false, isFullBleed: true, photo: true },
  { id: 'frame', name: 'Frame', description: "Edge-to-edge photo atop a light grey sidebar", bestFor: 'Business, operations and client-facing roles that use a photo', atsFriendly: false, isFullBleed: true, photo: true },
  { id: 'essential', name: 'Essential', description: "Basic black-and-white resume with a 3:4 photo", bestFor: 'Any role where a photo is expected; the simplest safe choice', atsFriendly: false, isFullBleed: true, photo: true },
  { id: 'capital', name: 'Capital', description: "Banking-format resume in Times, education first, small photo", bestFor: 'Finance, banking and consulting in Europe and Asia', atsFriendly: false, isFullBleed: true, photo: true, awards: true },
  { id: 'campus', name: 'Campus', description: "Student resume: round photo, education and projects first", bestFor: 'Students, new graduates and internship applications', atsFriendly: false, isFullBleed: true, photo: true, awards: true },
  { id: 'aurora', name: 'Aurora', description: "Clean single column with a 3:4 photo on the right", bestFor: 'Any role in markets that expect a photo', atsFriendly: false, isFullBleed: true, photo: true },
  { id: 'nova', name: 'Nova', description: "Centred round photo above the name, single column", bestFor: 'Client-facing, hospitality and education roles', atsFriendly: false, isFullBleed: true, photo: true },
  { id: 'cameo', name: 'Cameo', description: "Round photo left, name centre, contacts stacked right", bestFor: 'Business, sales and marketing roles that use a photo', atsFriendly: false, isFullBleed: true, photo: true },
  { id: 'sterling', name: 'Sterling', description: "Times resume with a capitalised name and a small photo", bestFor: 'Finance, law and corporate roles in Europe and Asia', atsFriendly: false, isFullBleed: true, photo: true },
  { id: 'meadow', name: 'Meadow', description: "Photo left, tinted headings, dates in a left column", bestFor: 'Applications in Germany, the Nordics and the Netherlands', atsFriendly: false, isFullBleed: true, photo: true },
  { id: 'vista', name: 'Vista', description: "Raleway with a round photo on the right", bestFor: 'Marketing, sales and creative business roles', atsFriendly: false, isFullBleed: true, photo: true },
  { id: 'ember', name: 'Ember', description: "Photo left, contacts stacked right, tinted headings", bestFor: 'Business and operations roles that use a photo', atsFriendly: false, isFullBleed: true, photo: true },
  { id: 'sage', name: 'Sage', description: "Round photo left, dates in a left column", bestFor: 'Applications in Europe with long, dated careers', atsFriendly: false, isFullBleed: true, photo: true },
  { id: 'marble', name: 'Marble', description: "Serif layout with a centred 3:4 photo and tinted headings", bestFor: 'Hospitality, education and administration', atsFriendly: false, isFullBleed: true, photo: true },
  { id: 'willow', name: 'Willow', description: "Round photo on the right, dates in a left column", bestFor: 'Applications in Europe with long, dated careers', atsFriendly: false, isFullBleed: true, photo: true },
  { id: 'ivory', name: 'Ivory', description: "Serif, 3:4 photo left, capitalised name, accent bars", bestFor: 'Corporate and banking roles in markets that expect a photo', atsFriendly: false, isFullBleed: true, photo: true },
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

/** Templates that show `data.awards`: the academic ones and those with `awards: true` (Federal). */
export const showsAwards = (template: TemplateConfig | undefined): boolean => Boolean(template?.publications || template?.awards);

/** All template IDs */
export const TEMPLATE_IDS: TemplateId[] = TEMPLATES.map((template) => template.id) as TemplateId[];

/** Template IDs that support full-bleed layout */
export const FULL_BLEED_TEMPLATE_IDS: TemplateId[] = TEMPLATES
  .filter((template) => template.isFullBleed)
  .map((template) => template.id) as TemplateId[];

/**
 * Templates retired as near-duplicates of another template, mapped to the one that replaced them,
 * so saved resumes, share links, agent calls and /templates/<id> pages keep working.
 */
export const RETIRED_TEMPLATE_IDS: Readonly<Record<string, TemplateId>> = {
  quill: 'folio',
  tribune: 'harbor',
  beacon: 'cobalt',
  keel: 'bedrock',
  crest: 'nova',
  zenith: 'nova',
  pearl: 'aurora',
  haven: 'cameo',
};

/** A template id with retired ids replaced by their successor. */
export const currentTemplateId = (id: string): string => (Object.hasOwn(RETIRED_TEMPLATE_IDS, id) ? RETIRED_TEMPLATE_IDS[id] : id);

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
