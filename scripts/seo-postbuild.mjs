import { promises as fs } from 'node:fs';
import path from 'node:path';
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

const readJson = async (filePath) => JSON.parse(await fs.readFile(filePath, 'utf8'));

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

const buildHomeSchema = (siteUrl) => {
  const organization = buildOrganizationSchema(siteUrl);
  const website = buildWebSiteSchema(siteUrl);

  return {
    '@context': 'https://schema.org',
    '@graph': [
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
        screenshot: `${siteUrl}${DEFAULT_OG_IMAGE}`,
        publisher: { '@id': organization['@id'] },
        isPartOf: { '@id': website['@id'] },
      },
    ],
  };
};

const buildDirectorySchema = (siteUrl, items) => {
  const organization = buildOrganizationSchema(siteUrl);
  const website = buildWebSiteSchema(siteUrl);

  return {
    '@context': 'https://schema.org',
    '@graph': [
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

const buildJobPageSchema = (siteUrl, title, pageUrl, templates) => {
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
        name: `Resume Templates for ${title}`,
        description: `Browse ModernCV resume templates for ${title}.`,
        url: pageUrl,
        inLanguage: 'en',
        isPartOf: { '@id': website['@id'] },
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

const buildEditorSchema = (siteUrl) => {
  const organization = buildOrganizationSchema(siteUrl);
  const website = buildWebSiteSchema(siteUrl);
  const pageUrl = `${siteUrl}/editor`;

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
        isPartOf: { '@id': website['@id'] },
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
    ${relatedSection}
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

  const jobItems = allTitles.map((title) => ({
    title,
    slug: slugifyJobTitle(title),
    path: `/resume_tmpl/${slugifyJobTitle(title)}`,
  }));

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

  const writePage = async ({ routePath, title, description, robots, ldJson, rootHtml }) => {
    const pageUrl = buildUrl(siteUrl, routePath);

    let html = templateHtml;
    html = setTitleTag(html, title);
    html = setMetaByName(html, 'title', title);
    html = setMetaByName(html, 'description', description);
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
    html = setMetaByProperty(html, 'og:image', `${siteUrl}${DEFAULT_OG_IMAGE}`);
    html = setMetaByProperty(html, 'og:image:alt', DEFAULT_IMAGE_ALT);

    html = setMetaByName(html, 'twitter:card', DEFAULT_TWITTER_CARD);
    html = setMetaByName(html, 'twitter:url', pageUrl);
    html = setMetaByName(html, 'twitter:title', title);
    html = setMetaByName(html, 'twitter:description', description);
    html = setMetaByName(html, 'twitter:image', `${siteUrl}${DEFAULT_OG_IMAGE}`);
    html = setMetaByName(html, 'twitter:image:alt', DEFAULT_IMAGE_ALT);

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
    ldJson: buildHomeSchema(siteUrl),
    rootHtml: '',
  });

  await writePage({
    routePath: '/directory',
    title: 'Browse Resume Templates by Job Title | ModernCV Directory',
    description: 'Explore resume templates by job title. Pick your role, preview designs, and build a professional resume with AI assistance.',
    robots: ROBOTS_INDEX,
    ldJson: buildDirectorySchema(siteUrl, jobItems),
    rootHtml: renderDirectoryRoot(categories, toPath),
  });

  await writePage({
    routePath: '/editor',
    title: 'Edit Your Resume Online | ModernCV Editor',
    description: 'Open the ModernCV resume editor to customize your content, apply templates, and export as PDF.',
    robots: ROBOTS_NOINDEX,
    ldJson: buildEditorSchema(siteUrl),
    rootHtml: renderEditorRoot(toPath),
  });

  for (const item of jobItems) {
    const pageTitle = `Resume Templates for ${item.title} | ModernCV`;
    const description = `Browse ModernCV resume templates for ${item.title}. Choose a layout, tailor content with AI suggestions, and download as PDF.`;
    const pageUrl = buildUrl(siteUrl, item.path);
    const categoryName = titleToCategory.get(item.title);
    const categoryTitles = categoryName ? categoryToTitles.get(categoryName) ?? [] : [];
    const relatedTitles = categoryTitles.filter((title) => title !== item.title).slice(0, 8);

    await writePage({
      routePath: item.path,
      title: pageTitle,
      description,
      robots: ROBOTS_INDEX,
      ldJson: buildJobPageSchema(siteUrl, item.title, pageUrl, templates),
      rootHtml: renderJobRoot(item.title, templates, relatedTitles, toPath),
    });
  }

  // Redirect rules: only keep legacy-to-canonical redirects. Avoid `.html`/`/index` rewrite targets,
  // which can be rejected by the platform due to clean-URL normalization loop detection.
  const redirects = ['# Generated by scripts/seo-postbuild.mjs', ...legacyRedirects].join('\n');

  await writeFileEnsuringDir(path.join(distDir, '_redirects'), `${redirects}\n`);
  if (shouldWritePublic() && (await fs.stat(publicDir).then(() => true).catch(() => false))) {
    await writeFileEnsuringDir(path.join(publicDir, '_redirects'), `${redirects}\n`);
  }

  const sitemapXml = buildSitemapXml({ siteUrl, lastmod, jobItems });
  const robotsTxt = buildRobotsTxt({ siteUrl });
  await writeFileEnsuringDir(path.join(distDir, 'sitemap.xml'), sitemapXml);
  await writeFileEnsuringDir(path.join(distDir, 'robots.txt'), robotsTxt);
  if (shouldWritePublic() && (await fs.stat(publicDir).then(() => true).catch(() => false))) {
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
