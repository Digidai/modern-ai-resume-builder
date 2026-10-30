import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { slugifyJobTitle } from './slugify.mjs';
import { buildRoleGuide } from '../src/shared/roleGuide.mjs';
import { buildJobPageTitle, describeExample, exampleToResume, formatRange, toBullets } from '../src/shared/roleExample.mjs';
import { MCP_TOOLS } from '../src/shared/agentPrompt.mjs';

const DEFAULT_SITE_URL = 'https://genedai.cv';
const SITE_NAME = 'ModernCV';
const DEFAULT_LOCALE = 'en_US';
const DEFAULT_OG_IMAGE = '/og-image.png';
const DEFAULT_IMAGE_ALT = 'ModernCV - AI Resume Builder';
const DEFAULT_TWITTER_CARD = 'summary_large_image';
const ROBOTS_INDEX = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';
const ROBOTS_NOINDEX = 'noindex, nofollow, noarchive';

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, 'dist');
const publicDir = path.join(projectRoot, 'public');
const jobTitlesPath = path.join(projectRoot, 'src', 'data', 'jobTitles.json');
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;
const OG_FONT_STACK = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

const shouldWritePublic = () => process.env.SEO_WRITE_PUBLIC === '1';

const toIsoDate = (date) => date.toISOString().slice(0, 10);

const getSiteUrl = () => {
  const raw = process.env.SITE_URL || process.env.VITE_SITE_URL || DEFAULT_SITE_URL;
  return raw.replace(/\/+$/, '');
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const escapeAttr = escapeHtml;

const truncateText = (value, maxLength) => {
  const text = String(value ?? '').trim();
  if (!text) return '';
  if (text.length <= maxLength) return text;
  if (maxLength <= 3) return text.slice(0, maxLength);
  return `${text.slice(0, maxLength - 3)}...`;
};

// SEO title max length is 60 characters. Format: "Resume Templates for {title} | ModernCV"
// Overhead: "Resume Templates for " (20) + " | ModernCV" (11) = 31 chars
// So job title should be <= 29 chars for safe SEO title length
const MAX_SEO_TITLE_LENGTH = 60;
const SEO_TITLE_OVERHEAD = 31; // "Resume Templates for " + " | ModernCV"

const shortenJobTitleForSeo = (title) => {
  const maxTitleLength = MAX_SEO_TITLE_LENGTH - SEO_TITLE_OVERHEAD;
  if (title.length <= maxTitleLength) return title;

  // If title has parentheses with abbreviation at end like "Business Development Representative (BDR)",
  // use the abbreviation: "BDR"
  const abbrevAtEndMatch = title.match(/^(.+?)\s*\(([A-Z]{2,})\)$/);
  if (abbrevAtEndMatch) {
    const abbreviated = abbrevAtEndMatch[2];
    if (abbreviated.length <= maxTitleLength) return abbreviated;
  }

  // If title has parentheses with expansion like "SDET (Software Development Engineer in Test)",
  // use the part before parentheses: "SDET"
  const abbrevAtStartMatch = title.match(/^([A-Z][A-Za-z/&]*)\s*\((.+)\)$/);
  if (abbrevAtStartMatch) {
    const abbreviated = abbrevAtStartMatch[1];
    if (abbreviated.length <= maxTitleLength) return abbreviated;
  }

  // Fallback: truncate with ellipsis
  return truncateText(title, maxTitleLength);
};

const buildSeoTitle = (jobTitle) => buildJobPageTitle(jobTitle);

/** Example resumes by title, from src/data/roles/*.json. */
const loadRoleExamples = async () => {
  const dir = path.join(projectRoot, 'src', 'data', 'roles');
  const files = (await fs.readdir(dir).catch(() => [])).filter((f) => f.endsWith('.json')).sort();
  const map = new Map();
  for (const file of files) {
    const data = JSON.parse(await fs.readFile(path.join(dir, file), 'utf8'));
    for (const [title, example] of Object.entries(data.titles ?? {})) map.set(title, example);
  }
  return map;
};

const renderExampleHtml = (title, example) => {
  const experience = example.experience
    .map(
      (e) =>
        `<h4>${escapeHtml(e.role)}, ${escapeHtml(e.company)}${e.location ? ` (${escapeHtml(e.location)})` : ''}</h4><p>${escapeHtml(formatRange(e))}</p>${htmlList(toBullets(e.description))}`
    )
    .join('');
  const projects = (example.projects ?? [])
    .map((p) => `<h4>${escapeHtml(p.name)}${p.link ? ` (${escapeHtml(p.link)})` : ''}</h4><p>${escapeHtml(p.description)}</p>`)
    .join('');
  const education = example.education.map((ed) => `<li>${escapeHtml(ed.degree)}, ${escapeHtml(ed.school)} (${escapeHtml(formatRange(ed))})</li>`).join('');
  return `<section id="example"><h2>${escapeHtml(title)} resume example</h2>
    <article>
      <h3>Summary</h3><p>${escapeHtml(example.summary)}</p>
      <h3>Experience</h3>${experience}
      ${projects ? `<h3>Projects</h3>${projects}` : ''}
      ${education ? `<h3>Education</h3><ul>${education}</ul>` : ''}
      ${example.skills.length ? `<h3>Skills</h3>${htmlList(example.skills)}` : ''}
    </article></section>`;
};

const BASE_KEYWORDS = [
  'ai resume builder',
  'free resume builder',
  'resume template',
  'cv builder',
  'ats friendly resume',
  'online resume creator',
];

const CATEGORY_KEYWORDS = {
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
  'Science & Research': ['scientist resume', 'research resume', 'lab resume template'],
  'Government & Public Service': ['government resume', 'federal resume', 'public sector resume'],
  'Nonprofit & Social Services': ['nonprofit resume', 'social worker resume', 'social services resume'],
  'Skilled Trades & Manufacturing': ['trades resume', 'manufacturing resume', 'technician resume'],
  'Transportation & Logistics': ['logistics resume', 'driver resume', 'transportation resume'],
};

const ROLE_KEYWORD_RULES = [
  { pattern: /\b(engineer|developer|architect|devops|sre|qa)\b/i, keywords: ['engineering resume'] },
  { pattern: /\b(data|analytics|bi|scientist|ml|ai)\b/i, keywords: ['data resume template'] },
  { pattern: /\b(designer|ux|ui|creative|art)\b/i, keywords: ['design resume template'] },
  { pattern: /\b(marketing|seo|growth|content|brand)\b/i, keywords: ['marketing cv template'] },
  { pattern: /\b(sales|account executive|business development|customer success)\b/i, keywords: ['sales cv template'] },
  { pattern: /\b(manager|director|head|chief|vp|lead)\b/i, keywords: ['leadership resume'] },
];

const HOME_FAQ_ITEMS = JSON.parse(await fs.readFile(path.join(process.cwd(), 'src', 'data', 'homeFaq.json'), 'utf8'));

const dedupeKeywords = (keywords) => {
  const seen = new Set();
  const result = [];
  for (const rawKeyword of keywords) {
    const keyword = String(rawKeyword ?? '').trim();
    if (!keyword) continue;
    const normalized = keyword.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(keyword);
  }
  return result;
};

const joinKeywords = (keywords) => dedupeKeywords(keywords).join(', ');

const getRoleKeywordsFromTitle = (jobTitle) =>
  ROLE_KEYWORD_RULES
    .filter((rule) => rule.pattern.test(jobTitle))
    .flatMap((rule) => rule.keywords);

const buildHomeKeywords = () =>
  joinKeywords([
    ...BASE_KEYWORDS,
    'resume maker',
    'resume writing assistant',
    'professional resume templates',
    'pdf resume download',
  ]);

const buildDirectoryKeywords = () =>
  joinKeywords([
    ...BASE_KEYWORDS,
    'resume templates by job title',
    'job specific resume examples',
    'resume role directory',
  ]);

const buildEditorKeywords = () =>
  joinKeywords([
    ...BASE_KEYWORDS,
    'resume editor',
    'online cv editor',
    'edit resume online',
    'resume customization',
  ]);

const buildJobKeywords = ({ jobTitle, categoryName }) =>
  joinKeywords([
    ...BASE_KEYWORDS,
    `${jobTitle} resume`,
    `${jobTitle} resume template`,
    `${jobTitle} CV`,
    `${jobTitle} CV example`,
    ...(categoryName ? CATEGORY_KEYWORDS[categoryName] ?? [] : []),
    ...getRoleKeywordsFromTitle(jobTitle),
  ]);

const buildJobDescription = ({ jobTitle, categoryName }) => {
  const categoryTemplates = {
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
    categoryTemplates[categoryName] ??
    `Browse ModernCV resume templates for ${jobTitle}. Pick a layout, start from a realistic example and download a PDF.`
  );
};

const resolveOgImageUrl = (siteUrl, ogImagePath) => {
  if (!ogImagePath) return `${siteUrl}${DEFAULT_OG_IMAGE}`;
  if (/^https?:\/\//i.test(ogImagePath)) return ogImagePath;
  if (ogImagePath.startsWith('/')) return `${siteUrl}${ogImagePath}`;
  return `${siteUrl}/${ogImagePath}`;
};

const replaceOrInsertMeta = (html, matcher, replacement) => {
  if (matcher.test(html)) return html.replace(matcher, replacement);
  return html.replace(/<\/head>/i, `  ${replacement}\n</head>`);
};

const setTitleTag = (html, title) =>
  html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`);

const setMetaByName = (html, name, content) =>
  replaceOrInsertMeta(
    html,
    new RegExp(`<meta\\s+name="${name}"\\s+content="[^"]*"\\s*\\/?>`, 'i'),
    `<meta name="${name}" content="${escapeAttr(content)}" />`
  );

const setMetaByProperty = (html, property, content) =>
  replaceOrInsertMeta(
    html,
    new RegExp(`<meta\\s+property="${property}"\\s+content="[^"]*"\\s*\\/?>`, 'i'),
    `<meta property="${property}" content="${escapeAttr(content)}" />`
  );

const replaceOrInsertLink = (html, matcher, replacement) => {
  if (matcher.test(html)) return html.replace(matcher, replacement);
  return html.replace(/<\/head>/i, `  ${replacement}\n</head>`);
};

const setCanonical = (html, href) =>
  replaceOrInsertLink(
    html,
    /<link\s+rel="canonical"[^>]*>/i,
    `<link rel="canonical" href="${escapeAttr(href)}" />`
  );

const setSitemapLink = (html, href) =>
  replaceOrInsertLink(
    html,
    /<link\s+rel="sitemap"[^>]*>/i,
    `<link rel="sitemap" type="application/xml" href="${escapeAttr(href)}" />`
  );

const setAlternateLinks = (html, links) => {
  const cleaned = html.replace(/<link\s+rel="alternate"[^>]*>\s*/gi, '');
  if (!links || links.length === 0) return cleaned;

  const markup = links
    .map(
      (link) =>
        `  <link rel="alternate" hreflang="${escapeAttr(link.hreflang)}" href="${escapeAttr(
          link.href
        )}" />`
    )
    .join('\n');

  return cleaned.replace(/<\/head>/i, `${markup}\n</head>`);
};

const setLdJson = (html, json) => {
  const start = '<script type="application/ld+json">';
  const startIndex = html.indexOf(start);
  if (startIndex === -1) return html;

  const endIndex = html.indexOf('</script>', startIndex);
  if (endIndex === -1) return html;

  const before = html.slice(0, startIndex);
  const after = html.slice(endIndex + '</script>'.length);
  const payload = `${start}\n${JSON.stringify(json, null, 2)}\n</script>`;
  return `${before}${payload}${after}`;
};

const setRootContent = (html, rootHtml) => {
  if (!rootHtml) return html;
  return html.replace(/<div id="root"><\/div>/i, `<div id="root">\n${rootHtml}\n</div>`);
};

const ensureDir = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const writeFileEnsuringDir = async (filePath, content) => {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content);
};

const lowerFirst = (text) => text.charAt(0).toLowerCase() + text.slice(1);

const readJson = async (filePath) => JSON.parse(await fs.readFile(filePath, 'utf8'));

/** Reads the template catalog from src/constants/templates.ts (single source of truth). */
const loadTemplates = async () => {
  const source = await fs.readFile(path.join(projectRoot, 'src', 'constants', 'templates.ts'), 'utf8');
  const field = (row, key) => {
    const m = row.match(new RegExp(`${key}: (?:'((?:[^'\\\\]|\\\\.)*)'|"((?:[^"\\\\]|\\\\.)*)"|(true|false))`));
    if (!m) return undefined;
    return m[3] ? m[3] === 'true' : (m[1] ?? m[2]).replace(/\\(.)/g, '$1');
  };
  const rows = source.match(/^\s*\{ id: '[a-z]+'.*\},$/gm) ?? [];
  const templates = rows.map((row) => ({
    id: field(row, 'id'),
    name: field(row, 'name'),
    description: field(row, 'description'),
    bestFor: field(row, 'bestFor'),
    atsFriendly: field(row, 'atsFriendly') === true,
  }));
  if (templates.length < 10 || templates.some((t) => !t.id || !t.name || !t.description || !t.bestFor)) {
    throw new Error('Could not parse TEMPLATE_CATALOG in src/constants/templates.ts');
  }
  return templates;
};

const renderSvgToPng = async (svg) => {
  const svgBuffer = Buffer.from(svg, 'utf8');
  return sharp(svgBuffer)
    .png({ compressionLevel: 9 })
    .toBuffer();
};

const writeOgImage = async ({ relativePath, svg, publicDirReady }) => {
  const outputPath = path.join(distDir, relativePath.replace(/^\//, ''));
  const pngBuffer = await renderSvgToPng(svg);
  await writeFileEnsuringDir(outputPath, pngBuffer);

  if (publicDirReady) {
    const publicPath = path.join(publicDir, relativePath.replace(/^\//, ''));
    await writeFileEnsuringDir(publicPath, pngBuffer);
  }
};

const buildUrl = (siteUrl, routePath) => {
  if (routePath === '/') return `${siteUrl}/`;
  // Ensure trailing slash for all paths to match server behavior
  const normalizedPath = routePath.endsWith('/') ? routePath : `${routePath}/`;
  return `${siteUrl}${normalizedPath}`;
};

const buildOrganizationSchema = (siteUrl) => ({
  '@type': 'Organization',
  '@id': `${siteUrl}/#organization`,
  name: SITE_NAME,
  url: `${siteUrl}/`,
  logo: {
    '@type': 'ImageObject',
    url: `${siteUrl}/apple-touch-icon.png`,
  },
});

const buildWebSiteSchema = (siteUrl) => ({
  '@type': 'WebSite',
  '@id': `${siteUrl}/#website`,
  name: SITE_NAME,
  url: `${siteUrl}/`,
  inLanguage: 'en',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${siteUrl}/directory/?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
});

const buildHomeSchema = (siteUrl, imageUrl, lastmodIso) => {
  const organization = buildOrganizationSchema(siteUrl);
  const website = buildWebSiteSchema(siteUrl);
  const resolvedImageUrl = imageUrl || `${siteUrl}${DEFAULT_OG_IMAGE}`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      organization,
      website,
      {
        '@type': 'WebApplication',
        '@id': `${siteUrl}/#webapp`,
        name: SITE_NAME,
        description: 'Free resume builder with ATS-friendly templates and vector PDF export',
        url: `${siteUrl}/`,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Any',
        isAccessibleForFree: true,
        dateModified: lastmodIso,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        featureList: [
          'ATS-friendly resume templates',
          'AI summary and bullet point writing',
          'Vector PDF export',
          'Custom accent colour, font and text size',
          'JSON Resume import',
          'No sign-up; data stays in the browser',
        ],
        screenshot: resolvedImageUrl,
        publisher: { '@id': organization['@id'] },
        isPartOf: { '@id': website['@id'] },
      },
      {
        '@type': 'WebPage',
        '@id': `${siteUrl}/#webpage`,
        name: 'ModernCV – Free Resume Builder',
        description: 'Free resume builder with example resumes for every job title. No account needed.',
        url: `${siteUrl}/`,
        inLanguage: 'en',
        dateModified: lastmodIso,
        isPartOf: { '@id': website['@id'] },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: resolvedImageUrl,
        },
      },
      {
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
      },
    ],
  };
};

const buildDirectorySchema = (siteUrl, items, imageUrl, lastmodIso) => {
  const organization = buildOrganizationSchema(siteUrl);
  const website = buildWebSiteSchema(siteUrl);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      organization,
      website,
      {
        '@type': 'CollectionPage',
        '@id': `${siteUrl}/directory/#collection`,
        name: 'Job Title Resume Template Directory',
        description: 'Browse ModernCV resume templates by job title and role.',
        url: `${siteUrl}/directory/`,
        inLanguage: 'en',
        dateModified: lastmodIso,
        isPartOf: { '@id': website['@id'] },
        ...(imageUrl
          ? {
              primaryImageOfPage: {
                '@type': 'ImageObject',
                url: imageUrl,
              },
            }
          : {}),
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.title,
            url: buildUrl(siteUrl, item.path),
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${siteUrl}/directory/#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
          { '@type': 'ListItem', position: 2, name: 'Job Directory', item: `${siteUrl}/directory/` },
        ],
      },
    ],
  };
};

const buildJobPageSchema = (siteUrl, title, pageUrl, templates, imageUrl, lastmodIso, faqs = [], occupation = null) => {
  const organization = buildOrganizationSchema(siteUrl);
  const website = buildWebSiteSchema(siteUrl);
  const hasTemplates = Array.isArray(templates) && templates.length > 0;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      organization,
      website,
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        name: `${title} resume example, templates and writing guide`,
        description: `A ${title} resume example, templates, example bullet points, skills and FAQs.`,
        about: { '@id': `${pageUrl}#occupation` },
        url: pageUrl,
        inLanguage: 'en',
        dateModified: lastmodIso,
        isPartOf: { '@id': website['@id'] },
        ...(imageUrl
          ? {
              primaryImageOfPage: {
                '@type': 'ImageObject',
                url: imageUrl,
              },
            }
          : {}),
        breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
        ...(hasTemplates
          ? {
              mainEntity: {
                '@type': 'ItemList',
                itemListElement: templates.map((template, index) => ({
                  '@type': 'ListItem',
                  position: index + 1,
                  name: `${template.name} resume template`,
                  url: `${siteUrl}/templates/${template.id}/`,
                })),
              },
            }
          : {}),
      },
      ...(occupation
        ? [
            {
              '@type': 'Occupation',
              '@id': `${pageUrl}#occupation`,
              name: title,
              ...(occupation.category ? { occupationalCategory: occupation.category } : {}),
              skills: occupation.skills.join(', '),
            },
          ]
        : []),
      ...(faqs.length
        ? [
            {
              '@type': 'FAQPage',
              '@id': `${pageUrl}#faq`,
              mainEntity: faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: { '@type': 'Answer', text: faq.answer },
              })),
            },
          ]
        : []),
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
          { '@type': 'ListItem', position: 2, name: 'Job Directory', item: `${siteUrl}/directory/` },
          { '@type': 'ListItem', position: 3, name: title, item: pageUrl },
        ],
      },
    ],
  };
};

const buildEditorSchema = (siteUrl, imageUrl, lastmodIso) => {
  const organization = buildOrganizationSchema(siteUrl);
  const website = buildWebSiteSchema(siteUrl);
  const pageUrl = `${siteUrl}/editor/`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      organization,
      website,
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        name: 'ModernCV Resume Editor',
        description: 'Interactive resume editor for building and exporting resumes.',
        url: pageUrl,
        inLanguage: 'en',
        dateModified: lastmodIso,
        isPartOf: { '@id': website['@id'] },
        ...(imageUrl
          ? {
              primaryImageOfPage: {
                '@type': 'ImageObject',
                url: imageUrl,
              },
            }
          : {}),
      },
    ],
  };
};

const buildSitemapXml = ({ siteUrl, lastmod, jobItems, templates, homeOgPath, directoryOgPath }) => {
  const urls = [
    { path: '/', priority: '1.0', changefreq: 'weekly', imagePath: homeOgPath },
    { path: '/directory', priority: '0.9', changefreq: 'weekly', imagePath: directoryOgPath },
    { path: '/templates', priority: '0.9', changefreq: 'weekly', imagePath: '/og/templates/classic.jpg' },
    { path: '/agents', priority: '0.7', changefreq: 'monthly', imagePath: '/og/templates/classic.jpg' },
    ...templates.map((t) => ({
      path: `/templates/${t.id}`,
      priority: '0.8',
      changefreq: 'monthly',
      imagePath: `/og/templates/${t.id}-page.jpg`,
    })),
    ...jobItems.map((item) => ({
      path: item.path,
      priority: '0.8',
      changefreq: 'weekly',
      imagePath: `/og/resume_tmpl/${item.slug}.png`,
    })),
  ];

  const body = urls
    .map((u) => {
      const imageMarkup = u.imagePath
        ? `
    <image:image>
      <image:loc>${escapeHtml(resolveOgImageUrl(siteUrl, u.imagePath))}</image:loc>
    </image:image>`
        : '';

      return `  <url>
    <loc>${escapeHtml(buildUrl(siteUrl, u.path))}</loc>
    <lastmod>${escapeHtml(lastmod)}</lastmod>
    <changefreq>${escapeHtml(u.changefreq)}</changefreq>
    <priority>${escapeHtml(u.priority)}</priority>
${imageMarkup}
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${body}\n</urlset>\n`;
};

// Search and AI answer engines are welcome (GEO); the API and dev routes are not content.
// `/editor` is not disallowed: it carries `noindex`, which crawlers can only see if they fetch it.
const AI_CRAWLERS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Bingbot', 'CCBot'];
const buildRobotsTxt = ({ siteUrl }) =>
  [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /dev/',
    'Disallow: /render/',
    '',
    ...AI_CRAWLERS.flatMap((bot) => [`User-agent: ${bot}`, 'Allow: /', 'Disallow: /api/', 'Disallow: /render/', '']),
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n');

const buildOgSvgShell = (content) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${OG_IMAGE_WIDTH}" height="${OG_IMAGE_HEIGHT}" viewBox="0 0 ${OG_IMAGE_WIDTH} ${OG_IMAGE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f8fafc" />
      <stop offset="100%" stop-color="#e2e8f0" />
    </linearGradient>
  </defs>
  <style>
    .brand { font-family: ${OG_FONT_STACK}; font-size: 18px; font-weight: 700; letter-spacing: 0.28em; fill: #6366f1; text-transform: uppercase; }
    .eyebrow { font-family: ${OG_FONT_STACK}; font-size: 16px; font-weight: 600; letter-spacing: 0.18em; fill: #64748b; text-transform: uppercase; }
    .title { font-family: ${OG_FONT_STACK}; font-size: 52px; font-weight: 700; fill: #0f172a; }
    .subtitle { font-family: ${OG_FONT_STACK}; font-size: 22px; font-weight: 400; fill: #475569; }
    .chip-text { font-family: ${OG_FONT_STACK}; font-size: 16px; font-weight: 600; fill: #0f172a; }
    .template-label { font-family: ${OG_FONT_STACK}; font-size: 14px; font-weight: 600; fill: #4338ca; }
  </style>
  <rect width="${OG_IMAGE_WIDTH}" height="${OG_IMAGE_HEIGHT}" fill="url(#bg)" />
  ${content}
</svg>`;

const buildDirectoryOgSvg = ({ titles, totalTitles, totalCategories, templateCount }) => {
  const displayTitles = titles.slice(0, 8);
  const chipWidth = 280;
  const chipHeight = 40;
  const chipGapX = 16;
  const chipGapY = 14;
  const chipStartX = 72;
  const chipStartY = 280;
  const chipCols = 2;

  const chips = displayTitles
    .map((title, index) => {
      const col = index % chipCols;
      const row = Math.floor(index / chipCols);
      const x = chipStartX + col * (chipWidth + chipGapX);
      const y = chipStartY + row * (chipHeight + chipGapY);
      const label = truncateText(title, 24);
      return `
      <g>
        <rect x="${x}" y="${y}" width="${chipWidth}" height="${chipHeight}" rx="10" fill="#ffffff" stroke="#e2e8f0" />
        <text x="${x + 14}" y="${y + 26}" class="chip-text">${escapeHtml(label)}</text>
      </g>`;
    })
    .join('\n');

  const templateLabel = `${templateCount} Templates`;

  const content = `
  <text class="brand" x="72" y="80">ModernCV</text>
  <text class="title" x="72" y="150">Job Title Directory</text>
  <text class="subtitle" x="72" y="200">${escapeHtml(
    `${totalTitles} roles across ${totalCategories} categories`
  )}</text>
  ${chips}
  <g transform="translate(760 130)">
    <rect x="18" y="18" width="320" height="400" rx="16" fill="#e2e8f0" opacity="0.5" />
    <rect x="9" y="9" width="320" height="400" rx="16" fill="#e2e8f0" opacity="0.8" />
    <rect x="0" y="0" width="320" height="400" rx="16" fill="#ffffff" stroke="#e2e8f0" />
    <rect x="0" y="0" width="320" height="8" rx="4" fill="#6366f1" />
    <rect x="24" y="28" width="140" height="16" rx="6" fill="#0f172a" />
    <rect x="24" y="52" width="110" height="10" rx="5" fill="#94a3b8" />
    <rect x="24" y="78" width="272" height="2" fill="#e2e8f0" />
    <rect x="24" y="98" width="76" height="8" rx="4" fill="#cbd5e1" />
    <rect x="24" y="118" width="250" height="8" rx="4" fill="#e2e8f0" />
    <rect x="24" y="136" width="230" height="8" rx="4" fill="#e2e8f0" />
    <rect x="24" y="154" width="240" height="8" rx="4" fill="#e2e8f0" />
    <rect x="24" y="188" width="96" height="8" rx="4" fill="#cbd5e1" />
    <rect x="24" y="208" width="246" height="8" rx="4" fill="#e2e8f0" />
    <rect x="24" y="226" width="216" height="8" rx="4" fill="#e2e8f0" />
    <rect x="24" y="244" width="256" height="8" rx="4" fill="#e2e8f0" />
    <rect x="24" y="330" width="140" height="26" rx="13" fill="#eef2ff" />
    <text x="36" y="348" class="template-label">${escapeHtml(templateLabel)}</text>
  </g>`;

  return buildOgSvgShell(content);
};

const buildJobOgSvg = ({ title, templateName }) => {
  const displayTitle = truncateText(title, 34);
  const titleFontSize = displayTitle.length > 28 ? 46 : 52;
  const templateLabel = truncateText(`${templateName} Template`, 22);

  const content = `
  <text class="brand" x="72" y="80">ModernCV</text>
  <text class="eyebrow" x="72" y="128">Resume Templates For</text>
  <text class="title" x="72" y="195" font-size="${titleFontSize}">${escapeHtml(displayTitle)}</text>
  <text class="subtitle" x="72" y="245">Pick a template, customize content, export PDF.</text>
  <g transform="translate(700 90)">
    <rect x="0" y="0" width="420" height="470" rx="18" fill="#ffffff" stroke="#e2e8f0" />
    <rect x="0" y="0" width="420" height="8" rx="4" fill="#6366f1" />
    <rect x="32" y="30" width="200" height="18" rx="6" fill="#0f172a" />
    <rect x="32" y="56" width="150" height="10" rx="5" fill="#94a3b8" />
    <rect x="32" y="82" width="356" height="2" fill="#e2e8f0" />
    <rect x="32" y="102" width="90" height="8" rx="4" fill="#cbd5e1" />
    <rect x="32" y="122" width="320" height="8" rx="4" fill="#e2e8f0" />
    <rect x="32" y="140" width="300" height="8" rx="4" fill="#e2e8f0" />
    <rect x="32" y="158" width="330" height="8" rx="4" fill="#e2e8f0" />
    <rect x="32" y="190" width="110" height="8" rx="4" fill="#cbd5e1" />
    <rect x="32" y="210" width="310" height="8" rx="4" fill="#e2e8f0" />
    <rect x="32" y="228" width="280" height="8" rx="4" fill="#e2e8f0" />
    <rect x="32" y="246" width="320" height="8" rx="4" fill="#e2e8f0" />
    <rect x="32" y="278" width="110" height="8" rx="4" fill="#cbd5e1" />
    <rect x="32" y="298" width="310" height="8" rx="4" fill="#e2e8f0" />
    <rect x="32" y="316" width="260" height="8" rx="4" fill="#e2e8f0" />
    <rect x="32" y="334" width="300" height="8" rx="4" fill="#e2e8f0" />
    <rect x="32" y="390" width="160" height="28" rx="14" fill="#eef2ff" />
    <text x="48" y="409" class="template-label">${escapeHtml(templateLabel)}</text>
  </g>`;

  return buildOgSvgShell(content);
};

const buildEditorOgSvg = () => {
  const content = `
  <text class="brand" x="72" y="80">ModernCV</text>
  <text class="eyebrow" x="72" y="128">Resume Editor</text>
  <text class="title" x="72" y="195">Customize with live preview</text>
  <text class="subtitle" x="72" y="245">Edit sections, switch templates, export PDF.</text>
  <g transform="translate(650 110)">
    <rect x="0" y="0" width="470" height="420" rx="18" fill="#ffffff" stroke="#e2e8f0" />
    <rect x="0" y="0" width="470" height="8" rx="4" fill="#6366f1" />
    <rect x="24" y="28" width="160" height="16" rx="6" fill="#0f172a" />
    <rect x="24" y="52" width="120" height="10" rx="5" fill="#94a3b8" />
    <rect x="24" y="80" width="180" height="10" rx="5" fill="#e2e8f0" />
    <rect x="24" y="100" width="200" height="10" rx="5" fill="#e2e8f0" />
    <rect x="24" y="120" width="190" height="10" rx="5" fill="#e2e8f0" />
    <rect x="240" y="28" width="206" height="300" rx="12" fill="#f8fafc" stroke="#e2e8f0" />
    <rect x="260" y="48" width="150" height="12" rx="6" fill="#0f172a" />
    <rect x="260" y="70" width="110" height="8" rx="4" fill="#94a3b8" />
    <rect x="260" y="92" width="170" height="8" rx="4" fill="#e2e8f0" />
    <rect x="260" y="110" width="150" height="8" rx="4" fill="#e2e8f0" />
    <rect x="260" y="128" width="180" height="8" rx="4" fill="#e2e8f0" />
    <rect x="260" y="156" width="90" height="8" rx="4" fill="#cbd5e1" />
    <rect x="260" y="176" width="160" height="8" rx="4" fill="#e2e8f0" />
    <rect x="260" y="194" width="140" height="8" rx="4" fill="#e2e8f0" />
  </g>`;

  return buildOgSvgShell(content);
};

const renderHomeRoot = ({ featuredTitles, templates, titleCount, toPath }) => {
  const roleLinks = featuredTitles
    .map((title) => {
      const href = toPath(`/resume_tmpl/${slugifyJobTitle(title)}`);
      return `<li><a class="text-accent underline underline-offset-2 hover:text-ink" href="${escapeAttr(href)}">${escapeHtml(title)}</a></li>`;
    })
    .join('\n');

  const templateLinks = templates
    .map((template) => `<li><a href="${escapeAttr(toPath(`/templates/${template.id}/`))}">${escapeHtml(template.name)}</a></li>`)
    .join('\n');

  return `
  <main class="max-w-6xl mx-auto p-6 md:p-10">
    <header class="mb-10">
      <h1 class="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white">Start from a real resume for your job.</h1>
      <p class="mt-3 text-slate-600 dark:text-slate-400 max-w-3xl">Pick from ${titleCount} job titles to get a complete example and writing guide, or write your own. Switch between ${templates.length} templates and download a PDF that applicant tracking systems can read. No account needed.</p>
      <div class="mt-6 flex flex-wrap gap-4">
        <a class="inline-flex h-10 items-center justify-center rounded-lg bg-ink px-5 text-paper font-medium hover:bg-ink-hover transition-colors" href="${escapeAttr(toPath('/editor'))}">Start building</a>
        <a class="inline-flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 px-5 py-3 text-slate-900 dark:text-white hover:bg-white/60 dark:hover:bg-slate-900/60 transition-colors" href="${escapeAttr(toPath('/directory'))}">Browse job titles</a>
      </div>
    </header>
    <section class="mb-10">
      <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-3">Popular roles</h2>
      <ul class="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
        ${roleLinks}
      </ul>
    </section>
    <section class="mb-10">
      <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-3">Templates</h2>
      <ul class="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-slate-700 dark:text-slate-200">
        ${templateLinks}
      </ul>
    </section>
    <noscript>
      <p class="mt-10 text-sm text-slate-600">JavaScript is required to use the interactive resume editor.</p>
    </noscript>
  </main>`;
};

const renderDirectoryRoot = (categories, toPath) => {
  const categoryCards = categories
    .map((category) => {
      const links = category.titles
        .map((title) => {
          const href = toPath(`/resume_tmpl/${slugifyJobTitle(title)}`);
          return `<li><a class="text-accent underline underline-offset-2 hover:text-ink" href="${escapeAttr(href)}">${escapeHtml(title)}</a></li>`;
        })
        .join('\n');
      return `
      <section class="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-3">${escapeHtml(category.name)}</h2>
        <ul class="space-y-1 text-sm">${links}</ul>
      </section>`;
    })
    .join('\n');

  return `
  <main class="max-w-7xl mx-auto p-6 md:p-10">
    <header class="mb-10">
      <h1 class="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Browse Resume Templates by Job Title</h1>
      <p class="mt-3 text-slate-600 dark:text-slate-400 max-w-3xl">Pick your role to preview templates, then open the editor to customize content and export to PDF.</p>
      <p class="mt-4"><a class="text-accent underline underline-offset-2 hover:text-ink" href="${escapeAttr(toPath('/'))}">Back to ModernCV</a></p>
    </header>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${categoryCards}
    </div>
    <noscript>
      <p class="mt-10 text-sm text-slate-600">JavaScript is required to use the interactive resume editor.</p>
    </noscript>
  </main>`;
};

const htmlList = (items, tag = 'ul') => `<${tag}>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</${tag}>`;

const renderJobRoot = (title, guide, relatedTitles, toPath, example) => {
  const recommended = guide.recommended
    .map((t) => `<li><a href="${escapeAttr(toPath(`/templates/${t.id}/`))}">${escapeHtml(t.name)}</a>${t.atsFriendly ? ' (ATS-friendly)' : ''}: ${escapeHtml(t.description)}</li>`)
    .join('');
  const related = (relatedTitles ?? [])
    .map((r) => `<li><a href="${escapeAttr(toPath(`/resume_tmpl/${slugifyJobTitle(r)}/`))}">${escapeHtml(r)}</a></li>`)
    .join('');
  const faqs = guide.faqs.map((f) => `<h3>${escapeHtml(f.question)}</h3><p>${escapeHtml(f.answer)}</p>`).join('');

  return `
  <main class="max-w-4xl mx-auto p-6">
    <nav aria-label="Breadcrumb"><a href="${escapeAttr(toPath('/'))}">Home</a> / <a href="${escapeAttr(toPath('/directory/'))}">Resume examples</a> / <span aria-current="page">${escapeHtml(title)}</span></nav>
    <h1>${escapeHtml(title)} resume example &amp; templates</h1>
    <p>${example ? `A realistic ${escapeHtml(title)} resume shown in every design. Start from the example or use the design with your own resume.` : `See your resume as a ${escapeHtml(title)} in every design. Pick one, edit the content, and download a PDF.`}</p>
    <p><a href="${escapeAttr(toPath('/editor/'))}">Open the resume editor</a></p>
    ${example ? renderExampleHtml(title, example) : ''}
    <h2>How to write a ${escapeHtml(title)} resume</h2>
    <p>${escapeHtml(guide.intro)} ${escapeHtml(guide.advice)}</p>
    <h3>Sections, in order</h3>${htmlList(guide.sections, 'ol')}
    <p><strong>Length:</strong> ${escapeHtml(guide.length)}</p>
    <p><strong>Summary:</strong> ${escapeHtml(guide.summaryTip)}</p>
    <h3>Skills to feature</h3>${htmlList(guide.skills)}
    <h3>Example bullet points</h3>${htmlList(guide.bullets)}
    <h3>Tips from recruiters</h3>${htmlList(guide.tips)}
    <h3>Recommended templates</h3><ul>${recommended}</ul>
    <h2>${escapeHtml(title)} resume FAQ</h2>${faqs}
    ${related ? `<h2>Related roles</h2><ul>${related}</ul>` : ''}
  </main>`;
};

const renderTemplatesRoot = (templates, toPath) => `
  <main class="max-w-6xl mx-auto p-6">
    <nav aria-label="Breadcrumb"><a href="${escapeAttr(toPath('/'))}">Home</a> / <span aria-current="page">Templates</span></nav>
    <h1>Resume templates</h1>
    <p>${templates.length} free resume templates. ${templates.filter((t) => t.atsFriendly).length} are single-column with standard headings, so applicant tracking systems (ATS) read them reliably. Every template supports your own accent colour, font and text size.</p>
    <ul>${templates
      .map(
        (t) =>
          `<li><a href="${escapeAttr(toPath(`/templates/${t.id}/`))}"><img src="/og/templates/${escapeAttr(t.id)}-page.jpg" alt="${escapeAttr(`${t.name} resume template preview`)}" width="599" height="848" loading="lazy"> ${escapeHtml(t.name)}</a>${t.atsFriendly ? ' (ATS-friendly)' : ''}: ${escapeHtml(t.description)}</li>`
      )
      .join('')}</ul>
  </main>`;

const renderTemplateRoot = (t, roles, toPath) => `
  <main class="max-w-6xl mx-auto p-6">
    <nav aria-label="Breadcrumb"><a href="${escapeAttr(toPath('/'))}">Home</a> / <a href="${escapeAttr(toPath('/templates/'))}">Templates</a> / <span aria-current="page">${escapeHtml(t.name)}</span></nav>
    <h1>${escapeHtml(t.name)} resume template</h1>
    <p>${escapeHtml(t.description)}.</p>
    <img src="/og/templates/${escapeAttr(t.id)}-page.jpg" alt="${escapeAttr(`${t.name} resume template preview`)}" width="599" height="848">
    <p><a href="${escapeAttr(toPath(`/editor/?template=${t.id}`))}">Use this template</a></p>
    <dl>
      <dt>ATS</dt><dd>${t.atsFriendly ? 'Friendly: single column, standard headings and real text in reading order.' : 'Use with care: multi-column or decorative layouts can confuse some applicant tracking systems.'}</dd>
      <dt>Best for</dt><dd>${escapeHtml(t.bestFor)}</dd>
      <dt>Customize</dt><dd>Accent colour, font (10 options) and text size, plus fit-to-one-page.</dd>
      <dt>Export</dt><dd>Vector PDF with selectable text, or print from the browser. A4 page size.</dd>
    </dl>
    ${roles.length ? `<h2>Popular with</h2><ul>${roles.map((r) => `<li><a href="${escapeAttr(toPath(`/resume_tmpl/${slugifyJobTitle(r)}/`))}">${escapeHtml(r)}</a></li>`).join('')}</ul>` : ''}
  </main>`;

const renderAgentsRoot = (siteUrl, tools, templateCount, toPath) => `
  <main class="max-w-3xl mx-auto p-6 md:p-10">
    <nav aria-label="Breadcrumb"><a href="${escapeAttr(toPath('/'))}">Home</a> / <span aria-current="page">AI agents</span></nav>
    <h1 class="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Use ModernCV from AI agents</h1>
    <p class="mt-4">Connect Claude, ChatGPT, Cursor or any MCP client to ModernCV. Agents can read writing guides and example resumes, render any of the ${templateCount} templates to a PNG preview or a vector PDF, and hand the user an editor link. Free, no account, no API key.</p>
    <h2>MCP server</h2>
    <p>Remote MCP over Streamable HTTP: <code>${escapeHtml(siteUrl)}/mcp</code></p>
    <ul>${tools.map(([name, desc]) => `<li><code>${escapeHtml(name)}</code>: ${escapeHtml(desc)}</li>`).join('')}</ul>
    <h2>Agent skill</h2>
    <p><a href="${escapeAttr(`${siteUrl}/skills/moderncv-resume/SKILL.md`)}">SKILL.md</a>: a step-by-step workflow for drafting, checking and exporting a resume.</p>
    <h2>HTTP API</h2>
    <p>The same capabilities as REST endpoints under <code>/api/agent/</code>. <a href="${escapeAttr(`${siteUrl}/openapi.json`)}">OpenAPI 3.1 spec</a>.</p>
    <p><a href="${escapeAttr(toPath('/templates/'))}">Browse templates</a> · <a href="${escapeAttr(`${siteUrl}/llms.txt`)}">llms.txt</a></p>
  </main>`;

const renderEditorRoot = (toPath) => `
  <main class="max-w-3xl mx-auto p-6 md:p-10">
    <h1 class="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">ModernCV Resume Editor</h1>
    <p class="mt-4 text-slate-600 dark:text-slate-400">This interactive editor requires JavaScript. If you're looking for templates, start in the directory.</p>
    <p class="mt-6"><a class="text-accent underline underline-offset-2 hover:text-ink" href="${escapeAttr(toPath('/directory'))}">Browse templates by job title</a></p>
    <noscript>
      <p class="mt-10 text-sm text-slate-600">JavaScript is required to use the editor.</p>
    </noscript>
  </main>`;

/** JSON Schema for the editor's import/backup format (JSON Resume documents are accepted too). */
const buildResumeSchema = (siteUrl, templates) => {
  const dated = (props) => ({
    type: 'object',
    additionalProperties: false,
    properties: {
      ...props,
      startDate: { type: 'string', description: 'YYYY-MM (or YYYY).', examples: ['2021-03'] },
      endDate: { type: 'string', description: 'YYYY-MM, or empty when current.' },
    },
  });
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `${siteUrl}/resume.schema.json`,
    title: 'ModernCV resume',
    description:
      'Import format for the ModernCV editor (Editor menu → Import backup). JSON Resume documents (https://jsonresume.org/schema) are also accepted and converted automatically.',
    type: 'object',
    required: ['fullName'],
    properties: {
      templateId: { type: 'string', enum: templates.map((t) => t.id), default: 'modern' },
      design: {
        type: 'object',
        properties: {
          accent: { type: 'string', pattern: '^(#[0-9A-Fa-f]{6})?$', description: 'Accent colour; empty for the template default.' },
          font: { type: 'string', enum: ['template', 'inter', 'source-sans', 'lato', 'roboto', 'source-serif', 'charis', 'garamond', 'tinos', 'plex-serif', 'latin-modern'] },
          scale: { type: 'number', minimum: 0.85, maximum: 1.15, default: 1 },
        },
      },
      fullName: { type: 'string' },
      title: { type: 'string', description: 'Target job title.' },
      email: { type: 'string' },
      phone: { type: 'string' },
      location: { type: 'string' },
      website: { type: 'string' },
      linkedin: { type: 'string' },
      photo: {
        type: 'string',
        maxLength: 200000,
        pattern: '^data:image/(jpeg|png|webp);base64,',
        description: 'Optional headshot as a base64 JPEG, PNG or WebP data URL (3:4 portrait, about 420 × 560 px). Only photo templates show it; leave it out for ATS portals and US or UK applications.',
      },
      links: {
        type: 'array',
        maxItems: 8,
        description: 'Extra profiles shown with the contact details (GitHub, portfolio, X, Dribbble, Google Scholar…). Leave label empty to detect it from the URL.',
        items: { type: 'object', required: ['url'], properties: { label: { type: 'string' }, url: { type: 'string' } } },
        examples: [[{ label: '', url: 'github.com/alexsterling' }, { label: 'Portfolio', url: 'alexsterling.design/work' }]],
      },
      summary: { type: 'string', description: 'Two or three sentences.' },
      experience: {
        type: 'array',
        items: dated({
          company: { type: 'string' },
          role: { type: 'string' },
          isCurrent: { type: 'boolean' },
          description: { type: 'string', description: 'One bullet per line, each starting with "- ".' },
        }),
      },
      education: { type: 'array', items: dated({ school: { type: 'string' }, degree: { type: 'string' } }) },
      publications: {
        type: 'array',
        description: 'Papers, articles and posters for academic and research CVs. Shown by templates with publications: true in list_templates (Scholar, Academic, Plain, Text, Graduate). The owner\'s name is bolded in authors automatically.',
        items: {
          type: 'object',
          required: ['title'],
          properties: {
            authors: { type: 'string', description: 'Author list in publication order, e.g. "Lee, P., Chen, J."' },
            title: { type: 'string' },
            venue: { type: 'string', description: 'Journal, conference, publisher or "Preprint".' },
            year: { type: 'string', description: '"2025" or "In press".' },
            link: { type: 'string', description: 'DOI or URL.' },
          },
        },
      },
      awards: {
        type: 'array',
        description: 'Grants, fellowships, scholarships and prizes. Shown by the same templates as publications.',
        items: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', description: 'e.g. "Graduate Research Fellowship".' },
            issuer: { type: 'string', description: 'Funder or awarding body.' },
            year: { type: 'string', description: '"2025" or "2023–2026".' },
            detail: { type: 'string', description: 'Optional amount, role or note, e.g. "$450,000, co-PI".' },
          },
        },
      },
      talks: {
        type: 'array',
        description: 'Invited talks, conference presentations, seminars and posters. Shown by the same templates as publications.',
        items: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string' },
            event: { type: 'string', description: 'Conference, seminar series or host, e.g. "NeurIPS, invited talk".' },
            location: { type: 'string' },
            year: { type: 'string' },
          },
        },
      },
      teaching: {
        type: 'array',
        description: 'Courses taught, TA roles and guest lectures. Shown by the same templates as publications.',
        items: {
          type: 'object',
          required: ['course'],
          properties: {
            course: { type: 'string', description: 'Course code and name, e.g. "CS 229: Machine Learning".' },
            role: { type: 'string', description: '"Instructor", "Teaching Assistant" or "Guest lecturer".' },
            institution: { type: 'string' },
            year: { type: 'string', description: '"2024" or "Fall 2023, Spring 2024".' },
          },
        },
      },
      projects: {
        type: 'array',
        items: {
          type: 'object',
          properties: { name: { type: 'string' }, link: { type: 'string' }, description: { type: 'string' } },
        },
      },
      skills: {
        type: 'array',
        items: { type: 'string' },
        description: 'Plain skills, or grouped as "Category: item, item".',
        examples: [['Languages: Go, TypeScript', 'Kubernetes']],
      },
    },
  };
};

const FONT_IDS = ['template', 'inter', 'source-sans', 'lato', 'roboto', 'source-serif', 'charis', 'garamond', 'tinos', 'plex-serif', 'latin-modern'];

/** OpenAPI 3.1 description of the agent HTTP API served by the Worker (worker/agent.ts). */
const buildOpenApi = (siteUrl, templates) => {
  const renderBody = {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['resume'],
          properties: {
            resume: { $ref: `${siteUrl}/resume.schema.json`, description: 'ModernCV resume object, or a JSON Resume document.' },
            template: { type: 'string', enum: templates.map((t) => t.id), default: 'modern' },
            accent: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$', description: 'Accent colour; omit for the template default.' },
            font: { type: 'string', enum: FONT_IDS, default: 'template' },
            scale: { type: 'number', minimum: 0.85, maximum: 1.15, default: 1, description: 'Text size; lower it to fit one page.' },
          },
        },
      },
    },
  };
  const error = { description: 'Error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } };
  const renderHeaders = {
    'x-resume-pages': { description: 'Height in A4 pages.', schema: { type: 'integer' } },
    'x-resume-warnings': { description: 'URL-encoded JSON array of content warnings.', schema: { type: 'string' } },
  };
  return {
    openapi: '3.1.0',
    info: {
      title: 'ModernCV Agent API',
      version: '1.0.0',
      description:
        `Draft-to-PDF resume API for AI agents: writing guides, example resumes, ${templates.length} templates, PNG previews, vector PDFs and editor handoff links. No auth; rendering is limited to 6 requests per minute per IP. Resumes are not stored. The same tools are available over MCP at ` +
        `${siteUrl}/mcp.`,
    },
    servers: [{ url: siteUrl }],
    security: [],
    paths: {
      '/api/agent/templates': {
        get: {
          operationId: 'listTemplates',
          summary: 'List resume templates',
          parameters: [{ name: 'ats_only', in: 'query', schema: { type: 'boolean' } }],
          responses: { 200: { description: 'Templates', content: { 'application/json': { schema: { type: 'object' } } } } },
        },
      },
      '/api/agent/guide': {
        get: {
          operationId: 'getWritingGuide',
          summary: 'Resume writing guide for a job title',
          parameters: [{ name: 'job_title', in: 'query', required: true, schema: { type: 'string' }, example: 'Data Analyst' }],
          responses: { 200: { description: 'Guide', content: { 'application/json': { schema: { type: 'object' } } } }, 400: error },
        },
      },
      '/api/agent/example': {
        get: {
          operationId: 'getExampleResume',
          summary: 'A complete example resume for a job title; its `resume` field is render-ready',
          parameters: [{ name: 'job_title', in: 'query', required: true, schema: { type: 'string' }, example: 'Registered Nurse (RN)' }],
          responses: {
            200: {
              description: 'Example',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      jobTitle: { type: 'string' },
                      family: { type: 'string' },
                      page: { type: 'string' },
                      resume: { type: 'object' },
                      matchedTitle: { type: 'string' },
                      exact: { type: 'boolean' },
                    },
                  },
                },
              },
            },
            400: error,
            404: error,
          },
        },
      },
      '/api/agent/link': {
        post: {
          operationId: 'createEditorLink',
          summary: 'Editor URL with the resume preloaded (carried in the URL fragment, not stored)',
          requestBody: renderBody,
          responses: {
            200: {
              description: 'Link',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { url: { type: 'string' }, template: { type: 'string' }, warnings: { type: 'array', items: { type: 'string' } } },
                  },
                },
              },
            },
            400: error,
          },
        },
      },
      '/api/agent/preview': {
        post: {
          operationId: 'renderPreview',
          summary: 'Render page 1 as PNG',
          requestBody: renderBody,
          responses: { 200: { description: 'PNG', headers: renderHeaders, content: { 'image/png': {} } }, 400: error, 429: error },
        },
      },
      '/api/agent/pdf': {
        post: {
          operationId: 'renderPdf',
          summary: 'Render an A4 vector PDF',
          requestBody: renderBody,
          responses: { 200: { description: 'PDF', headers: renderHeaders, content: { 'application/pdf': {} } }, 400: error, 429: error },
        },
      },
      '/api/agent/latex': {
        post: {
          operationId: 'exportLatex',
          summary: 'The resume as a standalone .tex file, with the filename, engine and Overleaf form fields',
          requestBody: renderBody,
          responses: {
            200: {
              description: 'LaTeX',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      filename: { type: 'string' },
                      engine: { type: 'string', enum: ['pdflatex', 'xelatex'] },
                      tex: { type: 'string' },
                      overleaf: { type: 'object' },
                      warnings: { type: 'array', items: { type: 'string' } },
                    },
                  },
                },
              },
            },
            400: error,
          },
        },
      },
      '/api/agent/publications': {
        post: {
          operationId: 'importPublications',
          summary: 'Publications from a public ORCID record (up to 4,000 works) or BibTeX, filterable by kind and year',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    orcid: { type: 'string', description: 'ORCID iD or orcid.org URL. Give this or bibtex.' },
                    bibtex: { type: 'string', description: 'Contents of a .bib file. Give this or orcid.' },
                    kinds: { type: 'array', items: { type: 'string', enum: ['journal', 'conference', 'preprint', 'book', 'thesis', 'other'] } },
                    from_year: { type: 'integer' },
                    to_year: { type: 'integer' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Publications; put the chosen ones, without kind, in resume.publications',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      source: { type: 'string' },
                      listed: { type: 'integer', description: 'Works the record lists' },
                      found: { type: 'integer', description: 'After merging duplicates' },
                      counts: { type: 'object', additionalProperties: { type: 'integer' } },
                      returned: { type: 'integer' },
                      publications: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: { authors: { type: 'string' }, title: { type: 'string' }, venue: { type: 'string' }, year: { type: 'string' }, link: { type: 'string' }, kind: { type: 'string' } },
                        },
                      },
                    },
                  },
                },
              },
            },
            400: error,
            404: error,
            429: error,
            502: error,
          },
        },
      },
    },
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: { error: { type: 'object', properties: { code: { type: 'string' }, message: { type: 'string' } } } },
        },
      },
    },
  };
};

const writeAgentFiles = async ({ siteUrl, templates, categories, jobItems, lastmod }) => {
  const ats = templates.filter((t) => t.atsFriendly);
  const templateLine = (t) =>
    `- [${t.name}](${siteUrl}/templates/${t.id}/): ${t.description}. ${t.atsFriendly ? 'ATS-friendly. ' : ''}Best for ${lowerFirst(t.bestFor)}.`;
  const intro = `# ModernCV

> ModernCV is a free, no-sign-up resume builder with ${templates.length} templates (${ats.length} ATS-friendly), AI writing help (Cloudflare Workers AI), and vector PDF export. Resumes are stored only in the user's browser.

Key facts:
- Free, no account, no watermark. Data stays in the browser (localStorage).
- Templates are A4 and support a custom accent colour, 10 fonts, text size and fit-to-one-page.
- Download PDF produces a vector PDF with selectable text and embedded fonts.
- Import accepts a ModernCV JSON backup or a JSON Resume (jsonresume.org) document.
- Open the editor with a template preselected: ${siteUrl}/editor/?template=<id> (ids are listed in ${siteUrl}/templates.json).
- Agents can build and export resumes directly: remote MCP server at ${siteUrl}/mcp, HTTP API at ${siteUrl}/api/agent/ (spec: ${siteUrl}/openapi.json), and an installable skill at ${siteUrl}/skills/moderncv-resume/SKILL.md.
`;

  const llms = `${intro}
## Start here

- [Resume editor](${siteUrl}/editor/): Edit, switch templates, use AI, download PDF.
- [All templates](${siteUrl}/templates/): Every design with a description and ATS status.
- [Resume examples by job title](${siteUrl}/directory/): Writing guides for ${jobItems.length} job titles.

## For agents

- [Agent setup guide](${siteUrl}/agents/): MCP client config, skill install, copy-paste prompts.
- MCP server (Streamable HTTP, no auth): \`${siteUrl}/mcp\`. Tools: ${MCP_TOOLS.map(([n]) => n).join(', ')}.
- [HTTP API (OpenAPI 3.1)](${siteUrl}/openapi.json): the same capabilities as REST endpoints under /api/agent/ (templates, guide, example, link, preview, pdf, latex, publications).
- [Agent skill](${siteUrl}/skills/moderncv-resume/SKILL.md): step-by-step workflow for drafting, checking and exporting a resume.
- Editor handoff link: ${siteUrl}/editor/#resume=<payload> opens the editor with a resume loaded. The payload is base64url-encoded resume JSON (or URL-encoded JSON); POST /api/agent/link builds a compact one. It stays in the URL fragment and never reaches the server.
- [Template catalog (JSON)](${siteUrl}/templates.json): ids, names, descriptions, ATS status, preview images and editor links.
- [Resume import schema (JSON Schema)](${siteUrl}/resume.schema.json): Produce a file in this shape, then the user imports it from the editor menu.
- [Full reference](${siteUrl}/llms-full.txt): All templates, writing guides per job family, and FAQs in one file.

## Recommended ATS-friendly templates

${ats.slice(0, 6).map(templateLine).join('\n')}

## Optional

- [Sitemap](${siteUrl}/sitemap.xml)
- [Source code](https://github.com/Digidai/modern-ai-resume-builder)
`;

  const guides = Object.entries(JSON.parse(await fs.readFile(path.join(projectRoot, 'src', 'data', 'roleGuides.json'), 'utf8')).categories)
    .map(([name, g]) => {
      const titles = categories.find((c) => c.name === name)?.titles ?? [];
      const recommended = g.templates.map((id) => templates.find((t) => t.id === id)?.name).filter(Boolean).join(', ');
      return `### ${name}

A strong resume shows ${g.focus}.

- Sections: ${g.sections.join(' → ')}
- Key skills: ${g.skills.join(', ')}
- Quantify with: ${g.metrics.join(', ')}
- Recommended templates: ${recommended}
- Example bullets:
${g.bullets.map((b) => `  - ${b}`).join('\n')}
- Tips:
${g.tips.map((t) => `  - ${t}`).join('\n')}
- Job pages: ${titles.map((t) => `[${t}](${siteUrl}/resume_tmpl/${slugifyJobTitle(t)}/)`).join(', ')}
`;
    })
    .join('\n');

  const full = `${intro}
Last updated: ${lastmod}

## Templates

${templates.map(templateLine).join('\n')}

## Agent API

Remote MCP server: ${siteUrl}/mcp (Streamable HTTP, stateless, no auth). Add it to Claude Code with \`claude mcp add --transport http moderncv ${siteUrl}/mcp\`.

| Tool / endpoint | Purpose |
|---|---|
| list_templates · GET /api/agent/templates | Templates with id, description, best-for, ATS status, preview |
| get_writing_guide · GET /api/agent/guide?job_title= | Section order, skills, metrics, example bullets, recommended templates |
| get_resume_schema · ${siteUrl}/resume.schema.json | JSON Schema of the resume object |
| render_preview · POST /api/agent/preview | Page 1 as PNG plus page count (header x-resume-pages) |
| render_pdf · POST /api/agent/pdf | A4 vector PDF |
| create_editor_link · POST /api/agent/link | Editor URL with the resume preloaded (in the URL fragment) |

POST bodies are \`{ "resume": {...}, "template": "classic", "accent": "#1F6E73", "font": "inter", "scale": 0.95 }\`; only \`resume\` is required. Rendering is limited to 6 per minute per IP. Resumes are rendered and discarded, never stored. Never invent facts for a user's resume.

## Import format

Create JSON matching ${siteUrl}/resume.schema.json (or a JSON Resume document) and import it from Editor → More actions → Import backup. Experience descriptions use one bullet per line starting with "- ". Skills may be grouped as "Category: item, item".

Example:

\`\`\`json
${JSON.stringify(
  {
    templateId: 'classic',
    fullName: 'Alex Sterling',
    title: 'Senior Product Designer',
    email: 'alex@example.com',
    location: 'San Francisco, CA',
    summary: 'Product designer with 6 years of experience building SaaS tools.',
    experience: [
      {
        company: 'TechNova',
        role: 'Senior Product Designer',
        startDate: '2021-03',
        endDate: '',
        isCurrent: true,
        description: '- Led the design system, cutting UI build time by 30%\n- Shipped 4 major releases',
      },
    ],
    education: [{ school: 'California College of the Arts', degree: 'BFA in Interaction Design', startDate: '2014-09', endDate: '2018-05' }],
    skills: ['Design: Figma, Prototyping', 'User Research'],
    projects: [],
  },
  null,
  2
)}
\`\`\`

## Resume writing guides by job family

${guides}
## FAQ

${HOME_FAQ_ITEMS.map((f) => `### ${f.question}\n\n${f.answer}\n`).join('\n')}`;

  const catalog = {
    name: 'ModernCV resume templates',
    updated: lastmod,
    editorUrl: `${siteUrl}/editor/`,
    importSchema: `${siteUrl}/resume.schema.json`,
    mcpServer: `${siteUrl}/mcp`,
    api: `${siteUrl}/openapi.json`,
    templates: templates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      bestFor: t.bestFor,
      atsFriendly: t.atsFriendly,
      url: `${siteUrl}/templates/${t.id}/`,
      useUrl: `${siteUrl}/editor/?template=${t.id}`,
      preview: `${siteUrl}/og/templates/${t.id}-page.jpg`,
    })),
  };

  await writeFileEnsuringDir(path.join(distDir, 'openapi.json'), `${JSON.stringify(buildOpenApi(siteUrl, templates), null, 2)}\n`);
  await writeFileEnsuringDir(
    path.join(distDir, 'skills', 'moderncv-resume', 'SKILL.md'),
    await fs.readFile(path.join(projectRoot, 'skills', 'moderncv-resume', 'SKILL.md'), 'utf8')
  );
  await writeFileEnsuringDir(path.join(distDir, 'llms.txt'), llms);
  await writeFileEnsuringDir(path.join(distDir, 'llms-full.txt'), full);
  await writeFileEnsuringDir(path.join(distDir, 'templates.json'), `${JSON.stringify(catalog, null, 2)}\n`);
  await writeFileEnsuringDir(path.join(distDir, 'resume.schema.json'), `${JSON.stringify(buildResumeSchema(siteUrl, templates), null, 2)}\n`);
};

const main = async () => {
  const siteUrl = getSiteUrl();
  const lastmod = toIsoDate(new Date());
  const lastmodIso = new Date().toISOString();

  const templateHtmlPath = path.join(distDir, 'index.html');
  const templateHtml = await fs.readFile(templateHtmlPath, 'utf8');
  const publicDirReady = shouldWritePublic()
    && (await fs.stat(publicDir).then(() => true).catch(() => false));

  const categories = await readJson(jobTitlesPath);
  if (!Array.isArray(categories)) {
    throw new Error(`Invalid job titles data: expected array in ${jobTitlesPath}`);
  }

  const allTitles = [];
  const seenTitles = new Set();
  const duplicateTitles = new Set();
  const slugToTitles = new Map();
  const roleExamples = await loadRoleExamples();
  const titleToCategory = new Map();
  const categoryToTitles = new Map();

  for (const category of categories) {
    if (!category || typeof category !== 'object') {
      throw new Error(`Invalid job titles data: category must be an object in ${jobTitlesPath}`);
    }
    if (typeof category.name !== 'string' || !category.name.trim()) {
      throw new Error(`Invalid job titles data: category.name must be a non-empty string in ${jobTitlesPath}`);
    }
    if (!Array.isArray(category.titles)) {
      throw new Error(`Invalid job titles data: category.titles must be an array in ${jobTitlesPath}`);
    }

    for (const rawTitle of category.titles) {
      if (typeof rawTitle !== 'string') {
        throw new Error(`Invalid job titles data: title must be a string in ${jobTitlesPath}`);
      }

      const title = rawTitle.trim();
      if (!title) continue;

      allTitles.push(title);
      if (!categoryToTitles.has(category.name)) {
        categoryToTitles.set(category.name, []);
      }
      categoryToTitles.get(category.name).push(title);
      titleToCategory.set(title, category.name);

      if (seenTitles.has(title)) duplicateTitles.add(title);
      seenTitles.add(title);

      const slug = slugifyJobTitle(title);
      const list = slugToTitles.get(slug) ?? [];
      list.push(title);
      slugToTitles.set(slug, list);
    }
  }

  if (duplicateTitles.size > 0) {
    throw new Error(
      `Duplicate job titles found in ${jobTitlesPath}: ${[...duplicateTitles].sort().join(', ')}`
    );
  }

  const slugCollisions = [...slugToTitles.entries()].filter(([, titles]) => titles.length > 1);
  if (slugCollisions.length > 0) {
    const preview = slugCollisions
      .slice(0, 20)
      .map(([slug, titles]) => `${slug}: ${titles.join(' | ')}`)
      .join('; ');
    throw new Error(`Job title slug collisions found in ${jobTitlesPath}: ${preview}`);
  }

  const templates = await loadTemplates();
  const roleGuides = await readJson(path.join(projectRoot, 'src', 'data', 'roleGuides.json'));
  const featuredTitles = categories
    .flatMap((category) => category.titles.slice(0, 2))
    .slice(0, 12);

  const jobItems = allTitles.map((title) => ({
    title,
    slug: slugifyJobTitle(title),
    path: `/resume_tmpl/${slugifyJobTitle(title)}`,
  }));

  const defaultTemplateName = templates.find((template) => template.id === 'modern')?.name
    ?? templates[0]?.name
    ?? 'Modern';
  // Home uses the designed share card in public/og-image.png.
  const homeOgPath = DEFAULT_OG_IMAGE;
  const editorOgPath = '/og/editor.png';
  const directoryOgPath = '/og/directory.png';
  const defaultJobOgPath = '/og/resume_tmpl/default.png';

  await writeOgImage({
    relativePath: editorOgPath,
    svg: buildEditorOgSvg(),
    publicDirReady,
  });

  await writeOgImage({
    relativePath: directoryOgPath,
    svg: buildDirectoryOgSvg({
      titles: allTitles,
      totalTitles: allTitles.length,
      totalCategories: categories.length,
      templateCount: templates.length,
    }),
    publicDirReady,
  });

  await writeOgImage({
    relativePath: defaultJobOgPath,
    svg: buildJobOgSvg({ title: 'Your Role', templateName: defaultTemplateName }),
    publicDirReady,
  });

  for (const item of jobItems) {
    await writeOgImage({
      relativePath: `/og/resume_tmpl/${item.slug}.png`,
      svg: buildJobOgSvg({ title: item.title, templateName: defaultTemplateName }),
      publicDirReady,
    });
  }

  const legacyRedirects = allTitles
    .map((title) => {
      const legacySlug = encodeURIComponent(String(title).replace(/\s+/g, '-'));
      const from = `/resume_tmpl/${legacySlug}`;
      const to = `/resume_tmpl/${slugifyJobTitle(title)}`;
      if (from === to) return null;
      return `${from} ${to} 301`;
    })
    .filter(Boolean);

  const toPath = (p) => p;

  const writePage = async ({
    routePath,
    title,
    description,
    keywords,
    robots,
    ldJson,
    rootHtml,
    ogImage,
    ogImageType = 'image/png',
    imageAlt,
  }) => {
    const pageUrl = buildUrl(siteUrl, routePath);
    const ogImageUrl = resolveOgImageUrl(siteUrl, ogImage);
    const resolvedImageAlt = imageAlt ?? DEFAULT_IMAGE_ALT;
    const resolvedKeywords = keywords || '';

    let html = templateHtml;
    html = setTitleTag(html, title);
    html = setMetaByName(html, 'title', title);
    html = setMetaByName(html, 'description', description);
    html = setMetaByName(html, 'keywords', resolvedKeywords);
    html = setMetaByName(html, 'robots', robots);
    html = setMetaByName(html, 'googlebot', robots);
    html = setMetaByName(html, 'author', SITE_NAME);
    html = setMetaByName(html, 'application-name', SITE_NAME);
    html = setMetaByName(html, 'referrer', 'strict-origin-when-cross-origin');
    html = setCanonical(html, pageUrl);
    html = setSitemapLink(html, `${siteUrl}/sitemap.xml`);
    html = setAlternateLinks(html, [
      { hreflang: 'en', href: pageUrl },
      { hreflang: 'x-default', href: pageUrl },
    ]);

    html = setMetaByProperty(html, 'og:url', pageUrl);
    html = setMetaByProperty(html, 'og:title', title);
    html = setMetaByProperty(html, 'og:description', description);
    html = setMetaByProperty(html, 'og:type', 'website');
    html = setMetaByProperty(html, 'og:site_name', SITE_NAME);
    html = setMetaByProperty(html, 'og:locale', DEFAULT_LOCALE);
    html = setMetaByProperty(html, 'og:updated_time', lastmodIso);
    html = setMetaByProperty(html, 'og:image', ogImageUrl);
    html = setMetaByProperty(html, 'og:image:alt', resolvedImageAlt);
    html = setMetaByProperty(html, 'og:image:width', String(OG_IMAGE_WIDTH));
    html = setMetaByProperty(html, 'og:image:height', String(OG_IMAGE_HEIGHT));
    html = setMetaByProperty(html, 'og:image:type', ogImageType);
    html = setMetaByProperty(html, 'og:image:secure_url', ogImageUrl);

    html = setMetaByName(html, 'twitter:card', DEFAULT_TWITTER_CARD);
    html = setMetaByName(html, 'twitter:url', pageUrl);
    html = setMetaByName(html, 'twitter:title', title);
    html = setMetaByName(html, 'twitter:description', description);
    html = setMetaByName(html, 'twitter:image', ogImageUrl);
    html = setMetaByName(html, 'twitter:image:alt', resolvedImageAlt);

    html = setLdJson(html, ldJson);
    html = setRootContent(html, rootHtml);

    const outPath =
      routePath === '/'
        ? path.join(distDir, 'index.html')
        : path.join(distDir, routePath.replace(/^\//, ''), 'index.html');

    await writeFileEnsuringDir(outPath, html);
  };

  await writePage({
    routePath: '/',
    title: `ModernCV – Free Resume Builder with ${templates.length} Templates, No Sign-up`,
    description:
      `Free resume builder with ${templates.length} templates and ${allTitles.length} example resumes by job title. No account, optional AI writing help, and a PDF with selectable text.`,
    keywords: buildHomeKeywords(),
    robots: ROBOTS_INDEX,
    ldJson: buildHomeSchema(siteUrl, resolveOgImageUrl(siteUrl, homeOgPath), lastmodIso),
    rootHtml: renderHomeRoot({ featuredTitles, templates, titleCount: allTitles.length, toPath }),
    ogImage: homeOgPath,
    imageAlt: 'ModernCV resume builder preview',
  });

  const directoryOgImageUrl = resolveOgImageUrl(siteUrl, directoryOgPath);
  await writePage({
    routePath: '/directory',
    title: 'Browse Resume Templates by Job Title | ModernCV Directory',
    description: `${allTitles.length} resume examples by job title, each with a writing guide. Pick your role, preview it in ${templates.length} templates and download a PDF.`,
    keywords: buildDirectoryKeywords(),
    robots: ROBOTS_INDEX,
    ldJson: buildDirectorySchema(siteUrl, jobItems, directoryOgImageUrl, lastmodIso),
    rootHtml: renderDirectoryRoot(categories, toPath),
    ogImage: directoryOgPath,
    imageAlt: 'ModernCV job title resume template directory preview',
  });

  await writePage({
    routePath: '/editor',
    title: 'Edit Your Resume Online | ModernCV Editor',
    description: 'Open the ModernCV resume editor to customize your content, apply templates, and export as PDF.',
    keywords: buildEditorKeywords(),
    robots: ROBOTS_NOINDEX,
    ldJson: buildEditorSchema(siteUrl, resolveOgImageUrl(siteUrl, editorOgPath), lastmodIso),
    rootHtml: renderEditorRoot(toPath),
    ogImage: editorOgPath,
    imageAlt: 'ModernCV resume editor preview',
  });

  // Bare paper the agent renderer prints (src/views/RenderView.tsx); never indexed.
  await writePage({
    routePath: '/render',
    title: 'Resume | ModernCV',
    description: 'Printable resume rendered by ModernCV.',
    keywords: '',
    robots: ROBOTS_NOINDEX,
    ldJson: [],
    rootHtml: '',
    ogImage: editorOgPath,
  });

  for (const item of jobItems) {
    const pageTitle = buildSeoTitle(item.title);
    const categoryName = titleToCategory.get(item.title);
    const example = roleExamples.get(item.title);
    const description = example ? describeExample(item.title, example, templates.length) : buildJobDescription({ jobTitle: item.title, categoryName });
    const keywords = buildJobKeywords({ jobTitle: item.title, categoryName });
    const pageUrl = buildUrl(siteUrl, item.path);
    const jobOgPath = `/og/resume_tmpl/${item.slug}.png`;
    const jobOgImageUrl = resolveOgImageUrl(siteUrl, jobOgPath);
    const categoryTitles = categoryName ? categoryToTitles.get(categoryName) ?? [] : [];
    const relatedTitles = categoryTitles.filter((title) => title !== item.title).slice(0, 8);
    const guide = buildRoleGuide({ title: item.title, category: categoryName, data: roleGuides, templates });

    await writePage({
      routePath: item.path,
      title: pageTitle,
      description,
      keywords,
      robots: ROBOTS_INDEX,
      ldJson: buildJobPageSchema(siteUrl, item.title, pageUrl, guide.recommended, jobOgImageUrl, lastmodIso, guide.faqs, { category: categoryName, skills: guide.skills }),
      rootHtml: renderJobRoot(item.title, guide, relatedTitles, toPath, example),
      ogImage: jobOgPath,
      imageAlt: `Resume templates for ${item.title}`,
    });
  }

  // Static example resumes for agents and integrations: /examples/<slug>.json (also used by the MCP server).
  for (const item of jobItems) {
    const example = roleExamples.get(item.title);
    if (!example) continue;
    const { fullName: _n, email: _e, phone: _p, linkedin: _l, website: _w, links: _k, location, ...resume } = exampleToResume({
      title: item.title,
      fullName: 'Sample Person',
      example,
      makeId: () => undefined,
    });
    // Raw example for the job page preview (one small file per title instead of a whole family chunk).
    await writeFileEnsuringDir(path.join(distDir, 'role-examples', `${item.slug}.json`), JSON.stringify(example));
    const strip = (items) => items.map(({ id: _id, ...rest }) => rest);
    await writeFileEnsuringDir(
      path.join(distDir, 'examples', `${item.slug}.json`),
      `${JSON.stringify(
        {
          jobTitle: item.title,
          family: titleToCategory.get(item.title) ?? null,
          page: buildUrl(siteUrl, item.path),
          resume: { ...resume, location, experience: strip(resume.experience), education: strip(resume.education), projects: strip(resume.projects) },
        },
        null,
        2
      )}\n`
    );
  }

  const atsCount = templates.filter((t) => t.atsFriendly).length;
  const templatesUrl = `${siteUrl}/templates/`;
  const templatesDescription = `${templates.length} free resume templates, ${atsCount} of them ATS-friendly. Inspired by Jake's Resume, Harvard, Awesome-CV and moderncv. Preview with your own content and download a PDF.`;
  await writePage({
    routePath: '/templates',
    title: `${templates.length} Free Resume Templates (ATS-Friendly) | ModernCV`,
    description: templatesDescription,
    keywords: joinKeywords(['resume templates', 'ats friendly resume template', 'free resume template', 'cv template', ...BASE_KEYWORDS]),
    robots: ROBOTS_INDEX,
    ldJson: {
      '@context': 'https://schema.org',
      '@graph': [
        buildOrganizationSchema(siteUrl),
        buildWebSiteSchema(siteUrl),
        {
          '@type': 'CollectionPage',
          '@id': `${templatesUrl}#webpage`,
          name: 'Resume templates',
          description: templatesDescription,
          url: templatesUrl,
          inLanguage: 'en',
          dateModified: lastmodIso,
          isPartOf: { '@id': `${siteUrl}/#website` },
          breadcrumb: { '@id': `${templatesUrl}#breadcrumb` },
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: templates.length,
            itemListElement: templates.map((t, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: `${t.name} resume template`,
              url: `${siteUrl}/templates/${t.id}/`,
            })),
          },
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${templatesUrl}#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
            { '@type': 'ListItem', position: 2, name: 'Templates', item: templatesUrl },
          ],
        },
      ],
    },
    rootHtml: renderTemplatesRoot(templates, toPath),
    ogImage: '/og/templates/classic.jpg',
    ogImageType: 'image/jpeg',
    imageAlt: 'ModernCV resume templates',
  });

  for (const t of templates) {
    const pageUrl = `${siteUrl}/templates/${t.id}/`;
    const description = `${t.name} resume template: ${t.description}. ${t.atsFriendly ? 'ATS-friendly single column. ' : ''}Best for ${lowerFirst(t.bestFor)}. Free, with PDF export.`;
    const roles = categories
      .filter((c) => roleGuides.categories[c.name]?.templates.includes(t.id))
      .flatMap((c) => c.titles.slice(0, 4))
      .slice(0, 12);
    const pageImage = `${siteUrl}/og/templates/${t.id}-page.jpg`;
    await writePage({
      routePath: `/templates/${t.id}`,
      title: `${t.name} Resume Template${t.atsFriendly ? ' (ATS-Friendly)' : ''} | ModernCV`,
      description,
      keywords: joinKeywords([`${t.name.toLowerCase()} resume template`, ...(t.atsFriendly ? ['ats friendly resume template'] : []), ...BASE_KEYWORDS]),
      robots: ROBOTS_INDEX,
      ldJson: {
        '@context': 'https://schema.org',
        '@graph': [
          buildOrganizationSchema(siteUrl),
          buildWebSiteSchema(siteUrl),
          {
            '@type': 'WebPage',
            '@id': `${pageUrl}#webpage`,
            name: `${t.name} resume template`,
            description,
            url: pageUrl,
            inLanguage: 'en',
            dateModified: lastmodIso,
            isPartOf: { '@id': `${siteUrl}/#website` },
            breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
            primaryImageOfPage: { '@type': 'ImageObject', url: pageImage },
          },
          {
            '@type': 'CreativeWork',
            '@id': `${pageUrl}#template`,
            name: `${t.name} resume template`,
            description,
            image: pageImage,
            isAccessibleForFree: true,
            encodingFormat: 'application/pdf',
            audience: { '@type': 'Audience', audienceType: t.bestFor },
            publisher: { '@id': `${siteUrl}/#organization` },
          },
          {
            '@type': 'BreadcrumbList',
            '@id': `${pageUrl}#breadcrumb`,
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
              { '@type': 'ListItem', position: 2, name: 'Templates', item: templatesUrl },
              { '@type': 'ListItem', position: 3, name: t.name, item: pageUrl },
            ],
          },
        ],
      },
      rootHtml: renderTemplateRoot(t, roles, toPath),
      ogImage: `/og/templates/${t.id}.jpg`,
      ogImageType: 'image/jpeg',
      imageAlt: `${t.name} resume template preview`,
    });
  }

  const agentsUrl = `${siteUrl}/agents/`;
  const agentsDescription = `Connect Claude, ChatGPT, Cursor or any AI agent to ModernCV: a free remote MCP server, an agent skill and an HTTP API to draft resumes, render ${templates.length} templates to PDF and hand off an editor link.`;
  await writePage({
    routePath: '/agents',
    title: 'Use ModernCV from AI Agents (MCP Server, Skill, API) | ModernCV',
    description: agentsDescription,
    keywords: joinKeywords(['resume mcp server', 'ai agent resume builder', 'claude resume skill', 'resume pdf api', 'chatgpt resume builder', ...BASE_KEYWORDS]),
    robots: ROBOTS_INDEX,
    ldJson: {
      '@context': 'https://schema.org',
      '@graph': [
        buildOrganizationSchema(siteUrl),
        buildWebSiteSchema(siteUrl),
        {
          '@type': 'TechArticle',
          '@id': `${agentsUrl}#article`,
          headline: 'Use ModernCV from AI agents',
          description: agentsDescription,
          url: agentsUrl,
          inLanguage: 'en',
          dateModified: lastmodIso,
          isPartOf: { '@id': `${siteUrl}/#website` },
          about: ['Model Context Protocol', 'Resume', 'AI agents'],
        },
        {
          '@type': 'WebAPI',
          '@id': `${siteUrl}/#agent-api`,
          name: 'ModernCV Agent API',
          description: 'Writing guides, example resumes, PNG previews, vector PDFs and editor links for AI agents.',
          documentation: `${siteUrl}/openapi.json`,
          url: `${siteUrl}/mcp`,
          provider: { '@id': `${siteUrl}/#organization` },
          isAccessibleForFree: true,
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
            { '@type': 'ListItem', position: 2, name: 'AI agents', item: agentsUrl },
          ],
        },
      ],
    },
    rootHtml: renderAgentsRoot(siteUrl, MCP_TOOLS, templates.length, toPath),
    ogImage: '/og/templates/classic.jpg',
    ogImageType: 'image/jpeg',
    imageAlt: 'ModernCV for AI agents',
  });

  await writeAgentFiles({ siteUrl, templates, categories, jobItems, lastmod });

  // Shell the Worker serves (with a 404 status) for unknown URLs; the SPA renders the not-found view.
  let notFoundHtml = templateHtml;
  notFoundHtml = setTitleTag(notFoundHtml, 'Page not found | ModernCV');
  notFoundHtml = setMetaByName(notFoundHtml, 'robots', ROBOTS_NOINDEX);
  notFoundHtml = setMetaByName(notFoundHtml, 'googlebot', ROBOTS_NOINDEX);
  notFoundHtml = setRootContent(
    notFoundHtml,
    `<main class="max-w-3xl mx-auto p-6"><h1>We couldn't find that page</h1><p><a href="/editor/">Open the editor</a> · <a href="/templates/">Browse templates</a> · <a href="/directory/">Resume examples by job</a></p></main>`
  );
  await writeFileEnsuringDir(path.join(distDir, '404.html'), notFoundHtml);

  // Redirect rules: only keep legacy-to-canonical redirects. Avoid `.html`/`/index` rewrite targets,
  // which can be rejected by the platform due to clean-URL normalization loop detection.
  const redirects = ['# Generated by scripts/seo-postbuild.mjs', ...legacyRedirects].join('\n');

  await writeFileEnsuringDir(path.join(distDir, '_redirects'), `${redirects}\n`);
  if (publicDirReady) {
    await writeFileEnsuringDir(path.join(publicDir, '_redirects'), `${redirects}\n`);
  }

  const sitemapXml = buildSitemapXml({
    siteUrl,
    lastmod,
    jobItems,
    templates,
    homeOgPath,
    directoryOgPath,
  });
  const robotsTxt = buildRobotsTxt({ siteUrl });
  await writeFileEnsuringDir(path.join(distDir, 'sitemap.xml'), sitemapXml);
  await writeFileEnsuringDir(path.join(distDir, 'robots.txt'), robotsTxt);
  if (publicDirReady) {
    await writeFileEnsuringDir(path.join(publicDir, 'sitemap.xml'), sitemapXml);
    await writeFileEnsuringDir(path.join(publicDir, 'robots.txt'), robotsTxt);
  }

  // Keep lastmod available for downstream generators (sitemap script may reuse).
  await writeFileEnsuringDir(path.join(distDir, '.seo-lastmod'), `${lastmod}\n`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
