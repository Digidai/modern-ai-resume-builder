const BASE_KEYWORDS = [
  'ai resume builder',
  'free resume builder',
  'resume template',
  'cv builder',
  'ats friendly resume',
  'online resume creator',
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Engineering: ['software engineer resume', 'developer resume', 'technical resume'],
  'Design & Product': ['product designer resume', 'ux resume', 'product manager resume'],
  'Data & Analytics': ['data scientist resume', 'analytics resume', 'data analyst cv'],
  'Marketing & Growth': ['marketing resume', 'growth resume', 'seo resume template'],
  'Sales & Support': ['sales resume', 'account executive resume', 'customer success resume'],
  'HR & Operations': ['hr resume', 'operations resume', 'talent acquisition resume'],
  'Finance & Legal': ['finance resume', 'accountant resume', 'legal resume'],
  'Business & Strategy': ['strategy resume', 'program manager resume', 'business consultant resume'],
  'Operations & Supply Chain': ['supply chain resume', 'logistics resume', 'procurement resume'],
  Healthcare: ['healthcare resume', 'nursing resume', 'clinical resume template'],
  Education: ['teacher resume', 'education resume', 'academic cv'],
  'Creative & Media': ['creative resume', 'copywriter resume', 'media resume'],
  'Retail & Hospitality': ['retail resume', 'hospitality resume', 'customer service cv'],
  'Construction & Real Estate': ['construction resume', 'real estate resume', 'project engineer resume'],
};

const ROLE_KEYWORD_RULES: Array<{ pattern: RegExp; keywords: string[] }> = [
  { pattern: /\b(engineer|developer|architect|devops|sre|qa)\b/i, keywords: ['engineering resume'] },
  { pattern: /\b(data|analytics|bi|scientist|ml|ai)\b/i, keywords: ['data resume template'] },
  { pattern: /\b(designer|ux|ui|creative|art)\b/i, keywords: ['design resume template'] },
  { pattern: /\b(marketing|seo|growth|content|brand)\b/i, keywords: ['marketing cv template'] },
  { pattern: /\b(sales|account executive|business development|customer success)\b/i, keywords: ['sales cv template'] },
  { pattern: /\b(manager|director|head|chief|vp|lead)\b/i, keywords: ['leadership resume'] },
];

const dedupeKeywords = (keywords: string[]) => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const rawKeyword of keywords) {
    const keyword = rawKeyword.trim();
    if (!keyword) continue;
    const normalized = keyword.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(keyword);
  }
  return result;
};

export const joinKeywords = (keywords: string[]) => dedupeKeywords(keywords).join(', ');

export const buildHomeSeoKeywords = () =>
  joinKeywords([
    ...BASE_KEYWORDS,
    'resume maker',
    'resume writing assistant',
    'professional resume templates',
    'pdf resume download',
  ]);

export const buildDirectorySeoKeywords = () =>
  joinKeywords([
    ...BASE_KEYWORDS,
    'resume templates by job title',
    'job specific resume examples',
    'resume role directory',
  ]);

export const buildEditorSeoKeywords = () =>
  joinKeywords([
    ...BASE_KEYWORDS,
    'resume editor',
    'online cv editor',
    'edit resume online',
    'resume customization',
  ]);

export const buildJobSeoDescription = (jobTitle: string, categoryName?: string) => {
  const normalizedCategory = categoryName?.trim();
  const templates: Record<string, string> = {
    Engineering: `Explore ATS-friendly resume templates for ${jobTitle}. Highlight technical projects, architecture choices, and measurable delivery impact with AI guidance.`,
    'Design & Product': `Discover resume templates for ${jobTitle} roles that emphasize product thinking, user outcomes, and cross-functional collaboration.`,
    'Data & Analytics': `Use resume templates for ${jobTitle} positions to showcase analysis depth, business impact, and decision-ready insights.`,
    'Marketing & Growth': `Browse resume templates for ${jobTitle} jobs that spotlight campaign performance, conversion growth, and channel strategy.`,
    'Sales & Support': `Choose resume templates for ${jobTitle} roles that focus on pipeline creation, retention metrics, and customer outcomes.`,
    'HR & Operations': `Create a strong ${jobTitle} resume with templates built for process ownership, people operations, and cross-team execution.`,
    'Finance & Legal': `Find resume templates for ${jobTitle} opportunities that highlight compliance, financial rigor, and risk-aware decision making.`,
    'Business & Strategy': `Select resume templates for ${jobTitle} paths that emphasize strategic planning, stakeholder alignment, and execution results.`,
    'Operations & Supply Chain': `Review resume templates for ${jobTitle} roles designed to surface process optimization, planning accuracy, and fulfillment reliability.`,
    Healthcare: `Browse resume templates for ${jobTitle} candidates with a focus on patient outcomes, compliance, and multidisciplinary collaboration.`,
    Education: `Build a ${jobTitle} resume with templates that foreground student outcomes, curriculum leadership, and instructional effectiveness.`,
    'Creative & Media': `Pick resume templates for ${jobTitle} roles that showcase storytelling, brand consistency, and production quality.`,
    'Retail & Hospitality': `Use resume templates for ${jobTitle} jobs that highlight customer experience, team leadership, and operational efficiency.`,
    'Construction & Real Estate': `Explore resume templates for ${jobTitle} openings built around project delivery, site coordination, and compliance.`,
  };

  return (
    templates[normalizedCategory ?? ''] ??
    `Browse ModernCV resume templates for ${jobTitle}. Choose a layout, tailor content with AI suggestions, and download as PDF.`
  );
};

export const buildJobSeoKeywords = (jobTitle: string, categoryName?: string) => {
  const normalizedTitle = jobTitle.trim();
  const roleKeywords = ROLE_KEYWORD_RULES
    .filter((rule) => rule.pattern.test(normalizedTitle))
    .flatMap((rule) => rule.keywords);

  return joinKeywords([
    ...BASE_KEYWORDS,
    `${normalizedTitle} resume`,
    `${normalizedTitle} resume template`,
    `${normalizedTitle} CV`,
    `${normalizedTitle} CV example`,
    ...(categoryName ? CATEGORY_KEYWORDS[categoryName] ?? [] : []),
    ...roleKeywords,
  ]);
};

const HOME_FAQ_ITEMS = [
  {
    question: 'Is ModernCV free to use?',
    answer:
      'Yes. ModernCV is free to use and lets you edit resumes, switch templates, and export to PDF without paid tiers.',
  },
  {
    question: 'Can I tailor my resume to a specific job title?',
    answer:
      'Yes. You can browse role-based pages, pick a matching template, and customize resume content for each target position.',
  },
  {
    question: 'Are the resume templates ATS friendly?',
    answer:
      'The templates are designed with clear hierarchy and readable structure so your content remains easy for ATS parsers and recruiters.',
  },
  {
    question: 'Do I need to install anything to build my resume?',
    answer:
      'No installation is required. ModernCV runs in the browser and your resume can be exported directly as a PDF.',
  },
];

export const buildHomeFaqSchema = (siteUrl: string) => ({
  '@type': 'FAQPage',
  '@id': `${siteUrl}/#faq`,
  mainEntity: HOME_FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
});
