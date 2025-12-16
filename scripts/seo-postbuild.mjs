import { promises as fs } from 'node:fs';
import path from 'node:path';

const DEFAULT_SITE_URL = 'https://moderncv.pages.dev';

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

const slugifyJobTitle = (title) =>
  String(title)
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

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

const setCanonical = (html, href) =>
  html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${escapeAttr(href)}" />`
  );

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

const collectJobTitles = (categories) => categories.flatMap((c) => c.titles);

const buildUrl = (siteUrl, routePath) => {
  if (routePath === '/') return `${siteUrl}/`;
  return `${siteUrl}${routePath}`;
};

const buildHomeSchema = (siteUrl) => ({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'ModernCV',
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
  screenshot: `${siteUrl}/og-image.png`,
});

const buildDirectorySchema = (siteUrl, items) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Job Title Resume Template Directory',
  description: 'Browse ModernCV resume templates by job title and role.',
  url: `${siteUrl}/directory`,
  isPartOf: { '@type': 'WebSite', name: 'ModernCV', url: `${siteUrl}/` },
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.title,
      url: buildUrl(siteUrl, item.path),
    })),
  },
});

const buildJobPageSchema = (siteUrl, title, pageUrl) => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: `Resume Templates for ${title}`,
  description: `Browse ModernCV resume templates for ${title}.`,
  url: pageUrl,
  isPartOf: { '@type': 'WebSite', name: 'ModernCV', url: `${siteUrl}/` },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Job Directory', item: `${siteUrl}/directory` },
      { '@type': 'ListItem', position: 3, name: title, item: pageUrl },
    ],
  },
});

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
  return `User-agent: *\nAllow: /\nDisallow: /editor\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
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

const renderJobRoot = (title, templates, toPath) => {
  const templateItems = templates
    .map((t) => `<li class="px-3 py-2 rounded-lg bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">${escapeHtml(t)}</li>`)
    .join('\n');

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

  const templateHtmlPath = path.join(distDir, 'index.html');
  const templateHtml = await fs.readFile(templateHtmlPath, 'utf8');

  const categories = await readJson(jobTitlesPath);
  const allTitles = collectJobTitles(categories);

  const templates = [
    'Modern',
    'Minimalist',
    'Sidebar',
    'Executive',
    'Creative',
    'Compact',
    'Tech',
    'Professional',
    'Academic',
    'Elegant',
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

    html = setMetaByProperty(html, 'og:url', pageUrl);
    html = setMetaByProperty(html, 'og:title', title);
    html = setMetaByProperty(html, 'og:description', description);
    html = setMetaByProperty(html, 'og:image', `${siteUrl}/og-image.png`);

    html = setMetaByName(html, 'twitter:url', pageUrl);
    html = setMetaByName(html, 'twitter:title', title);
    html = setMetaByName(html, 'twitter:description', description);
    html = setMetaByName(html, 'twitter:image', `${siteUrl}/og-image.png`);

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
    robots: 'index, follow',
    ldJson: buildHomeSchema(siteUrl),
    rootHtml: '',
  });

  await writePage({
    routePath: '/directory',
    title: 'Browse Resume Templates by Job Title | ModernCV Directory',
    description: 'Explore resume templates by job title. Pick your role, preview designs, and build a professional resume with AI assistance.',
    robots: 'index, follow',
    ldJson: buildDirectorySchema(siteUrl, jobItems),
    rootHtml: renderDirectoryRoot(categories, toPath),
  });

  await writePage({
    routePath: '/editor',
    title: 'Edit Your Resume Online | ModernCV Editor',
    description: 'Open the ModernCV resume editor to customize your content, apply templates, and export as PDF.',
    robots: 'noindex, nofollow',
    ldJson: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'ModernCV Resume Editor',
      description: 'Interactive resume editor for building and exporting resumes.',
      url: `${siteUrl}/editor`,
      isPartOf: { '@type': 'WebSite', name: 'ModernCV', url: `${siteUrl}/` },
    },
    rootHtml: renderEditorRoot(toPath),
  });

  for (const item of jobItems) {
    const pageTitle = `Resume Templates for ${item.title} | ModernCV`;
    const description = `Browse ModernCV resume templates for ${item.title}. Choose a layout, tailor content with AI suggestions, and download as PDF.`;
    const pageUrl = buildUrl(siteUrl, item.path);

    await writePage({
      routePath: item.path,
      title: pageTitle,
      description,
      robots: 'index, follow',
      ldJson: buildJobPageSchema(siteUrl, item.title, pageUrl),
      rootHtml: renderJobRoot(item.title, templates, toPath),
    });
  }

  // Redirect rules: ensure pre-rendered routes resolve to their static HTML.
  const redirects = [
    ...legacyRedirects,
    '/directory /directory/index.html 200',
    '/editor /editor/index.html 200',
    ...jobItems.map((item) => `${item.path} ${item.path}/index.html 200`),
    '/* /index.html 200',
  ].join('\n');

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
