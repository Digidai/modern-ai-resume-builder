import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { slugifyJobTitle } from './slugify.mjs';

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

const generateJobKeywords = (jobTitle) => {
  const baseKeywords = [jobTitle, 'resume', 'CV', 'template'];
  const roleKeywords = {
    'software engineer': ['developer', 'programming', 'coding', 'software'],
    'data scientist': ['machine learning', 'analytics', 'python', 'data'],
    'product manager': ['product', 'agile', 'kanban', 'stakeholder', 'roadmap'],
    'ux designer': ['user experience', 'ui', 'ux design', 'figma', 'prototype'],
    'marketing manager': ['digital marketing', 'seo', 'content marketing', 'campaign'],
    'sales manager': ['b2b', 'sales', 'quota', 'deals', 'revenue'],
    'project manager': ['agile', 'scrum', 'jira', 'stakeholder', 'delivery'],
  };

  const titleLower = jobTitle.toLowerCase();
  const additionalKeywords = Object.entries(roleKeywords).reduce((acc, [role, keywords]) => {
    if (titleLower.includes(role.toLowerCase())) {
      acc.push(...keywords);
    }
    return acc;
  }, []);

  return [...baseKeywords, ...additionalKeywords];
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

const readJson = async (filePath) => JSON.parse(await fs.readFile(filePath, 'utf8'));

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
  return `${siteUrl}${routePath}`;
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
    target: `${siteUrl}/directory?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
});

const buildHomeSchema = (siteUrl, imageUrl) => {
  const organization = buildOrganizationSchema(siteUrl);
  const website = buildWebSiteSchema(siteUrl);
  const resolvedImageUrl = imageUrl || `${siteUrl}${DEFAULT_OG_IMAGE}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      website,
      {
        '@type': 'WebApplication',
        '@id': `${siteUrl}/#webapp`,
        name: SITE_NAME,
        description: 'Free AI-powered resume builder to create professional resumes online',
        url: `${siteUrl}/`,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Any',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        featureList: [
          'AI-powered resume suggestions',
          'Multiple professional templates',
          'PDF export',
          'Real-time preview',
          'Dark mode support',
        ],
        screenshot: resolvedImageUrl,
        publisher: { '@id': organization['@id'] },
        isPartOf: { '@id': website['@id'] },
      },
      {
        '@type': 'WebPage',
        '@id': `${siteUrl}/#webpage`,
        name: 'ModernCV - Free AI Resume Builder',
        description: 'Create stunning professional resumes in minutes with ModernCV.',
        url: `${siteUrl}/`,
        inLanguage: 'en',
        isPartOf: { '@id': website['@id'] },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: resolvedImageUrl,
        },
      },
    ],
  };
};
};

const buildDirectorySchema = (siteUrl, items, imageUrl) => {
  const organization = buildOrganizationSchema(siteUrl);
  const website = buildWebSiteSchema(siteUrl);

  return {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      website,
      {
        '@type': 'CollectionPage',
        '@id': `${siteUrl}/directory#collection`,
        name: 'Job Title Resume Template Directory',
        description: 'Browse ModernCV resume templates by job title and role.',
        url: `${siteUrl}/directory`,
        inLanguage: 'en',
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
        '@id': `${siteUrl}/directory#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
          { '@type': 'ListItem', position: 2, name: 'Job Directory', item: `${siteUrl}/directory` },
        ],
      },
    ],
  };
};

const buildJobPageSchema = (siteUrl, title, pageUrl, templates, imageUrl) => {
  const organization = buildOrganizationSchema(siteUrl);
  const website = buildWebSiteSchema(siteUrl);
  const hasTemplates = Array.isArray(templates) && templates.length > 0;

  return {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      website,
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        name: `Resume Templates for ${title}`,
        description: `Browse ModernCV resume templates for ${title}. Choose a clean, professional resume template for ${title} role. Customize content with AI suggestions, and download as PDF instantly.`,
        url: pageUrl,
        inLanguage: 'en',
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
                  name: template.name,
                  url: `${pageUrl}#template-${template.id}`,
                })),
              },
            }
          : {}),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
          { '@type': 'ListItem', position: 2, name: 'Job Directory', item: `${siteUrl}/directory` },
          { '@type': 'ListItem', position: 3, name: title, item: pageUrl },
        ],
      },
    ],
  };
};

const buildEditorSchema = (siteUrl, imageUrl) => {
  const organization = buildOrganizationSchema(siteUrl);
  const website = buildWebSiteSchema(siteUrl);
  const pageUrl = `${siteUrl}/editor`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      website,
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        name: 'ModernCV Resume Editor',
        description: 'Interactive resume editor for building and exporting resumes.',
        url: pageUrl,
        inLanguage: 'en',
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

const buildSitemapXml = ({ siteUrl, lastmod, jobItems }) => {
  const urls = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/directory', priority: '0.9', changefreq: 'weekly' },
    ...jobItems.map((item) => ({ path: item.path, priority: '0.8', changefreq: 'weekly' })),
  ];

  const body = urls
    .map(
      (u) => `  <url>
    <loc>${escapeHtml(buildUrl(siteUrl, u.path))}</loc>
    <lastmod>${escapeHtml(lastmod)}</lastmod>
    <changefreq>${escapeHtml(u.changefreq)}</changefreq>
    <priority>${escapeHtml(u.priority)}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
};

const buildRobotsTxt = ({ siteUrl }) => {
  // Prefer `noindex` on `/editor` over `Disallow`, so crawlers can see the directive.
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
};

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

const buildHomeOgSvg = ({ templateName }) => {
  const templateLabel = truncateText(`${templateName} Template`, 22);
  const content = `
  <text class="brand" x="72" y="80">ModernCV</text>
  <text class="eyebrow" x="72" y="128">AI Resume Builder</text>
  <text class="title" x="72" y="195">Build a resume in minutes</text>
  <text class="subtitle" x="72" y="245">Choose a template, tailor content, export PDF.</text>
  <g transform="translate(700 90)">
    <rect x="0" y="0" width="420" height="470" rx="18" fill="#ffffff" stroke="#e2e8f0" />
    <rect x="0" y="0" width="420" height="8" rx="4" fill="#6366f1" />
    <rect x="32" y="30" width="200" height="18" rx="6" fill="#0f172a" />
    <rect x="32" y="56" width="150" height="10" rx="5" fill="#94a3b8" />
    <rect x="32" y="82" width="356" height="2" fill="#e2e8f0" />
    <rect x="32" y="104" width="110" height="10" rx="5" fill="#cbd5e1" />
    <rect x="32" y="128" width="320" height="8" rx="4" fill="#e2e8f0" />
    <rect x="32" y="146" width="300" height="8" rx="4" fill="#e2e8f0" />
    <rect x="32" y="164" width="330" height="8" rx="4" fill="#e2e8f0" />
    <rect x="32" y="200" width="120" height="8" rx="4" fill="#cbd5e1" />
    <rect x="32" y="220" width="310" height="8" rx="4" fill="#e2e8f0" />
    <rect x="32" y="238" width="280" height="8" rx="4" fill="#e2e8f0" />
    <rect x="32" y="256" width="320" height="8" rx="4" fill="#e2e8f0" />
    <rect x="32" y="396" width="160" height="28" rx="14" fill="#eef2ff" />
    <text x="48" y="415" class="template-label">${escapeHtml(templateLabel)}</text>
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

const renderHomeRoot = ({ featuredTitles, templates, toPath }) => {
  const roleLinks = featuredTitles
    .map((title) => {
      const href = toPath(`/resume_tmpl/${slugifyJobTitle(title)}`);
      return `<li><a class="text-indigo-600 hover:underline" href="${escapeAttr(href)}">${escapeHtml(title)}</a></li>`;
    })
    .join('\n');

  const templateLinks = templates
    .map((template) => `<li class="text-slate-700 dark:text-slate-200">${escapeHtml(template.name)}</li>`)
    .join('\n');

  return `
  <main class="max-w-6xl mx-auto p-6 md:p-10">
    <header class="mb-10">
      <h1 class="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white">ModernCV AI Resume Builder</h1>
      <p class="mt-3 text-slate-600 dark:text-slate-400 max-w-3xl">Build a professional resume in minutes with modern templates, AI suggestions, and instant PDF export.</p>
      <div class="mt-6 flex flex-wrap gap-4">
        <a class="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-white font-semibold hover:bg-indigo-500 transition-colors" href="${escapeAttr(toPath('/editor'))}">Start building</a>
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
          return `<li><a class="text-indigo-600 hover:underline" href="${escapeAttr(href)}">${escapeHtml(title)}</a></li>`;
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
      <p class="mt-4"><a class="text-indigo-600 hover:underline" href="${escapeAttr(toPath('/'))}">Back to ModernCV</a></p>
    </header>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${categoryCards}
    </div>
    <noscript>
      <p class="mt-10 text-sm text-slate-600">JavaScript is required to use the interactive resume editor.</p>
    </noscript>
  </main>`;
};

const renderJobRoot = (title, templates, relatedTitles, toPath) => {
  const templateItems = templates
    .map(
      (t) =>
        `<li id="template-${escapeAttr(t.id)}" class="px-3 py-2 rounded-lg bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">${escapeHtml(t.name)}</li>`
    )
    .join('\n');

  const relatedLinks = (relatedTitles ?? [])
    .map((relatedTitle) => {
      const href = toPath(`/resume_tmpl/${slugifyJobTitle(relatedTitle)}`);
      return `<a class="px-3 py-1 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition-colors" href="${escapeAttr(
        href
      )}">${escapeHtml(relatedTitle)}</a>`;
    })
    .join('\n');

  const relatedSection = relatedLinks
    ? `
    <h2 class="mt-8 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Related roles</h2>
    <div class="mt-3 flex flex-wrap gap-2">
      ${relatedLinks}
    </div>`
    : '';

  return `
  <main class="max-w-4xl mx-auto p-6 md:p-10">
    <nav class="text-sm text-slate-500 dark:text-slate-400 mb-6">
      <a class="text-indigo-600 hover:underline" href="${escapeAttr(toPath('/'))}">Home</a>
      <span class="mx-2">/</span>
      <a class="text-indigo-600 hover:underline" href="${escapeAttr(toPath('/directory'))}">Job Directory</a>
      <span class="mx-2">/</span>
      <span class="text-slate-700 dark:text-slate-200">${escapeHtml(title)}</span>
    </nav>
    <h1 class="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Resume Templates for ${escapeHtml(title)}</h1>
    <p class="mt-4 text-slate-600 dark:text-slate-400 max-w-3xl">Choose a clean, professional resume template for ${escapeHtml(title)}. Customize content with AI suggestions, then download as PDF.</p>
    <h2 class="mt-8 text-lg font-semibold text-slate-900 dark:text-white">Popular templates</h2>
    <ul class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-800 dark:text-slate-200">
      ${templateItems}
     </ul>
    ${relatedSection ? `
    <h2 class="mt-8 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Related roles</h2>
    <div class="mt-3 flex flex-wrap gap-2">
      ${relatedSection}
    </div>` : ''}
    <div class="mt-8 flex flex-wrap gap-4">
      <a class="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-white font-semibold hover:bg-indigo-500 transition-colors" href="${escapeAttr(toPath('/editor'))}">Open resume editor</a>
      <a class="inline-flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 px-5 py-3 text-slate-900 dark:text-white hover:bg-white/60 dark:hover:bg-slate-900/60 transition-colors" href="${escapeAttr(toPath('/directory'))}">Browse other roles</a>
    </div>
    <noscript>
      <p class="mt-10 text-sm text-slate-600">JavaScript is required to preview templates and edit your resume.</p>
    </noscript>
  </main>`;
};

const renderEditorRoot = (toPath) => `
  <main class="max-w-3xl mx-auto p-6 md:p-10">
    <h1 class="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">ModernCV Resume Editor</h1>
    <p class="mt-4 text-slate-600 dark:text-slate-400">This interactive editor requires JavaScript. If you're looking for templates, start in the directory.</p>
    <p class="mt-6"><a class="text-indigo-600 hover:underline" href="${escapeAttr(toPath('/directory'))}">Browse templates by job title</a></p>
    <noscript>
      <p class="mt-10 text-sm text-slate-600">JavaScript is required to use the editor.</p>
    </noscript>
  </main>`;

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

  const templates = [
    { id: 'modern', name: 'Modern' },
    { id: 'minimalist', name: 'Minimalist' },
    { id: 'sidebar', name: 'Sidebar' },
    { id: 'executive', name: 'Executive' },
    { id: 'creative', name: 'Creative' },
    { id: 'compact', name: 'Compact' },
    { id: 'tech', name: 'Tech' },
    { id: 'professional', name: 'Professional' },
    { id: 'academic', name: 'Academic' },
    { id: 'elegant', name: 'Elegant' },
    { id: 'swiss', name: 'Swiss' },
    { id: 'opal', name: 'Opal' },
    { id: 'wireframe', name: 'Wireframe' },
    { id: 'berlin', name: 'Berlin' },
    { id: 'lateral', name: 'Lateral' },
    { id: 'iron', name: 'Iron' },
    { id: 'ginto', name: 'Ginto' },
    { id: 'symmetry', name: 'Symmetry' },
    { id: 'bronx', name: 'Bronx' },
    { id: 'path', name: 'Path' },
    { id: 'quartz', name: 'Quartz' },
    { id: 'silk', name: 'Silk' },
    { id: 'mono', name: 'Mono' },
    { id: 'pop', name: 'Pop' },
    { id: 'noir', name: 'Noir' },
    { id: 'paper', name: 'Paper' },
    { id: 'cast', name: 'Cast' },
    { id: 'moda', name: 'Moda' },
  ];
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
  const homeOgPath = '/og/home.png';
  const editorOgPath = '/og/editor.png';
  const directoryOgPath = '/og/directory.png';
  const defaultJobOgPath = '/og/resume_tmpl/default.png';

  await writeOgImage({
    relativePath: homeOgPath,
    svg: buildHomeOgSvg({ templateName: defaultTemplateName }),
    publicDirReady,
  });

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

  const writePage = async ({ routePath, title, description, robots, ldJson, rootHtml, ogImage, imageAlt, keywords }) => {
    const pageUrl = buildUrl(siteUrl, routePath);
    const ogImageUrl = resolveOgImageUrl(siteUrl, ogImage);
    const resolvedImageAlt = imageAlt ?? DEFAULT_IMAGE_ALT;
    const resolvedKeywords = keywords ?? generateJobKeywords(title);

    let html = templateHtml;
    html = setTitleTag(html, title);
    html = setMetaByName(html, 'title', title);
    html = setMetaByName(html, 'description', description);
    html = setMetaByName(html, 'keywords', resolvedKeywords);
    html = setMetaByName(html, 'robots', robots);
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
    html = setMetaByProperty(html, 'og:image:type', 'image/png');

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
    title: 'ModernCV - Free AI Resume Builder | Create Professional Resumes Online',
    description:
      "Create stunning professional resumes in minutes with ModernCV's free AI-powered resume builder. Choose templates, get AI suggestions, and download as PDF instantly.",
    robots: ROBOTS_INDEX,
    ldJson: buildHomeSchema(siteUrl, resolveOgImageUrl(siteUrl, homeOgPath)),
    rootHtml: renderHomeRoot({ featuredTitles, templates, toPath }),
    ogImage: homeOgPath,
    imageAlt: 'ModernCV AI resume builder preview',
  });

  const directoryOgImageUrl = resolveOgImageUrl(siteUrl, directoryOgPath);
  await writePage({
    routePath: '/directory',
    title: 'Browse Resume Templates by Job Title | ModernCV Directory',
    description: 'Explore resume templates by job title. Pick your role, preview designs, and build a professional resume with AI assistance.',
    robots: ROBOTS_INDEX,
    ldJson: buildDirectorySchema(siteUrl, jobItems, directoryOgImageUrl),
    rootHtml: renderDirectoryRoot(categories, toPath),
    ogImage: directoryOgPath,
    imageAlt: 'ModernCV job title resume template directory preview',
  });

  await writePage({
    routePath: '/editor',
    title: 'Edit Your Resume Online | ModernCV Editor',
    description: 'Open the ModernCV resume editor to customize your content, apply templates, and export as PDF.',
    robots: ROBOTS_NOINDEX,
    ldJson: buildEditorSchema(siteUrl, resolveOgImageUrl(siteUrl, editorOgPath)),
    rootHtml: renderEditorRoot(toPath),
    ogImage: editorOgPath,
    imageAlt: 'ModernCV resume editor preview',
  });

  for (const item of jobItems) {
    const pageTitle = `Resume Templates for ${item.title} | ModernCV`;
    const description = `Browse ModernCV resume templates for ${item.title}. Choose a layout, tailor content with AI suggestions, and download as PDF.`;
    const pageUrl = buildUrl(siteUrl, item.path);
    const jobOgPath = `/og/resume_tmpl/${item.slug}.png`;
    const jobOgImageUrl = resolveOgImageUrl(siteUrl, jobOgPath);
    const categoryName = titleToCategory.get(item.title);
    const categoryTitles = categoryName ? categoryToTitles.get(categoryName) ?? [] : [];
    const relatedTitles = categoryTitles.filter((title) => title !== item.title).slice(0, 8);

    await writePage({
      routePath: item.path,
      title: pageTitle,
      description,
      robots: ROBOTS_INDEX,
      keywords: generateJobKeywords(item.title),
      ldJson: buildJobPageSchema(siteUrl, item.title, pageUrl, templates, jobOgImageUrl),
      rootHtml: renderJobRoot(item.title, templates, relatedTitles, toPath),
      ogImage: jobOgPath,
      imageAlt: `Resume templates for ${item.title}`,
    });
  }

  // Redirect rules: only keep legacy-to-canonical redirects. Avoid `.html`/`/index` rewrite targets,
  // which can be rejected by the platform due to clean-URL normalization loop detection.
  const redirects = ['# Generated by scripts/seo-postbuild.mjs', ...legacyRedirects].join('\n');

  await writeFileEnsuringDir(path.join(distDir, '_redirects'), `${redirects}\n`);
  if (publicDirReady) {
    await writeFileEnsuringDir(path.join(publicDir, '_redirects'), `${redirects}\n`);
  }

  const sitemapXml = buildSitemapXml({ siteUrl, lastmod, jobItems });
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
