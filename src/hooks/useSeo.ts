import { useEffect } from 'react';

type SeoConfig = {
  title: string;
  description: string;
  keywords?: string | string[];
  canonical?: string;
  robots?: string;
  googleBot?: string;
  ogType?: string;
  ogSiteName?: string;
  ogLocale?: string;
  ogImage?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  ogImageType?: string;
  ogUpdatedTime?: string;
  imageAlt?: string;
  twitterCard?: string;
  sitemapPath?: string;
  ldJson?: Record<string, unknown>;
};

const DEFAULT_ROBOTS =
  'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';
const DEFAULT_OG_TYPE = 'website';
const DEFAULT_SITE_NAME = 'ModernCV';
const DEFAULT_LOCALE = 'en_US';
const DEFAULT_TWITTER_CARD = 'summary_large_image';
const DEFAULT_IMAGE_ALT = 'ModernCV - AI Resume Builder';
const DEFAULT_OG_IMAGE_WIDTH = 1200;
const DEFAULT_OG_IMAGE_HEIGHT = 630;
const DEFAULT_OG_IMAGE_TYPE = 'image/png';
const DEFAULT_SITEMAP_PATH = '/sitemap.xml';
const DEFAULT_KEYWORDS = [
  'ai resume builder',
  'resume template',
  'cv builder',
  'free resume creator',
  'ats friendly resume',
  'online resume builder',
];

const hasFileExtension = (pathname: string) => /\.[a-z0-9]{2,8}$/i.test(pathname);

const normalizeCanonicalPathname = (pathname: string) => {
  if (!pathname) return '/';
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (normalized === '/') return normalized;
  if (hasFileExtension(normalized)) return normalized;
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
};

const ensureMetaTag = (attrName: 'name' | 'property', attrValue: string) => {
  let meta = document.head.querySelector<HTMLMetaElement>(`meta[${attrName}="${attrValue}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attrName, attrValue);
    document.head.appendChild(meta);
  }
  return meta;
};

const setMetaContent = (attrName: 'name' | 'property', attrValue: string, content: string) => {
  const meta = ensureMetaTag(attrName, attrValue);
  meta.setAttribute('content', content);
};

const ensureLinkTag = (rel: string) => {
  let link = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }
  return link;
};

const ensureAlternateLinkTag = (hreflang: string) => {
  let link = document.head.querySelector<HTMLLinkElement>(
    `link[rel="alternate"][hreflang="${hreflang}"]`
  );
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('hreflang', hreflang);
    document.head.appendChild(link);
  }
  return link;
};

const toAbsoluteUrl = (value: string, origin: string) => {
  if (!value) return value;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) return `${origin}${value}`;
  return `${origin}/${value}`;
};

const buildCanonicalUrl = (canonical: string | undefined, origin: string) => {
  if (canonical) {
    try {
      const url = new URL(canonical, origin);
      url.pathname = normalizeCanonicalPathname(url.pathname);
      return url.toString();
    } catch {
      return toAbsoluteUrl(canonical, origin);
    }
  }
  const normalizedPath = normalizeCanonicalPathname(window.location.pathname || '/');
  return `${origin}${normalizedPath}`;
};

const getRuntimeSiteUrl = () => {
  const envSiteUrl = import.meta.env.VITE_SITE_URL;
  if (envSiteUrl) return envSiteUrl.replace(/\/+$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
};

const ensureLdJson = (payload: string) => {
  let script = document.head.querySelector<HTMLScriptElement>(
    'script[type="application/ld+json"][data-seo-managed="true"]'
  );
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo-managed', 'true');
    document.head.appendChild(script);
  }
  script.textContent = payload;
};

const toKeywordsContent = (keywords: string | string[] | undefined) => {
  if (!keywords) return '';
  const list = Array.isArray(keywords) ? keywords : keywords.split(',');
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const rawKeyword of list) {
    const keyword = rawKeyword.trim();
    if (!keyword) continue;
    const normalized = keyword.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    cleaned.push(keyword);
  }
  return cleaned.join(', ');
};

export const useSeo = ({
  title,
  description,
  keywords,
  canonical,
  robots,
  googleBot,
  ogType,
  ogSiteName,
  ogLocale,
  ogImage,
  ogImageWidth,
  ogImageHeight,
  ogImageType,
  ogUpdatedTime,
  imageAlt,
  twitterCard,
  sitemapPath,
  ldJson,
}: SeoConfig) => {
  const ldJsonPayload = ldJson ? JSON.stringify(ldJson, null, 2) : null;

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    const siteUrl = getRuntimeSiteUrl();
    const origin = siteUrl || window.location.origin;
    const canonicalUrl = buildCanonicalUrl(canonical, origin);
    const imageUrl = toAbsoluteUrl(ogImage ?? '/og-image.png', origin);
    const imageWidth = ogImageWidth ?? DEFAULT_OG_IMAGE_WIDTH;
    const imageHeight = ogImageHeight ?? DEFAULT_OG_IMAGE_HEIGHT;
    const imageType = ogImageType ?? DEFAULT_OG_IMAGE_TYPE;
    const resolvedImageAlt = imageAlt ?? DEFAULT_IMAGE_ALT;
    const sitemapUrl = toAbsoluteUrl(sitemapPath ?? DEFAULT_SITEMAP_PATH, origin);
    const robotsContent = robots ?? DEFAULT_ROBOTS;
    const googleBotContent = googleBot ?? robotsContent;
    const keywordsContent = toKeywordsContent(keywords) || DEFAULT_KEYWORDS.join(', ');

    document.title = title;

    setMetaContent('name', 'title', title);
    setMetaContent('name', 'description', description);
    setMetaContent('name', 'keywords', keywordsContent);
    setMetaContent('name', 'robots', robotsContent);
    setMetaContent('name', 'googlebot', googleBotContent);

    const canonicalLink = ensureLinkTag('canonical');
    canonicalLink.setAttribute('href', canonicalUrl);

    const englishAlternate = ensureAlternateLinkTag('en');
    englishAlternate.setAttribute('href', canonicalUrl);

    const defaultAlternate = ensureAlternateLinkTag('x-default');
    defaultAlternate.setAttribute('href', canonicalUrl);

    setMetaContent('property', 'og:url', canonicalUrl);
    setMetaContent('property', 'og:title', title);
    setMetaContent('property', 'og:description', description);
    setMetaContent('property', 'og:type', ogType ?? DEFAULT_OG_TYPE);
    setMetaContent('property', 'og:site_name', ogSiteName ?? DEFAULT_SITE_NAME);
    setMetaContent('property', 'og:locale', ogLocale ?? DEFAULT_LOCALE);
    setMetaContent('property', 'og:image', imageUrl);
    setMetaContent('property', 'og:image:alt', resolvedImageAlt);
    setMetaContent('property', 'og:image:width', String(imageWidth));
    setMetaContent('property', 'og:image:height', String(imageHeight));
    setMetaContent('property', 'og:image:type', imageType);
    setMetaContent('property', 'og:image:secure_url', imageUrl);
    if (ogUpdatedTime) {
      setMetaContent('property', 'og:updated_time', ogUpdatedTime);
    }

    setMetaContent('name', 'twitter:card', twitterCard ?? DEFAULT_TWITTER_CARD);
    setMetaContent('name', 'twitter:url', canonicalUrl);
    setMetaContent('name', 'twitter:title', title);
    setMetaContent('name', 'twitter:description', description);
    setMetaContent('name', 'twitter:image', imageUrl);
    setMetaContent('name', 'twitter:image:alt', resolvedImageAlt);

    const sitemapLink = ensureLinkTag('sitemap');
    sitemapLink.setAttribute('href', sitemapUrl);
    sitemapLink.setAttribute('type', 'application/xml');

    if (ldJsonPayload) {
      ensureLdJson(ldJsonPayload);
    }
  }, [
    title,
    description,
    keywords,
    canonical,
    robots,
    googleBot,
    ogType,
    ogSiteName,
    ogLocale,
    ogImage,
    ogImageWidth,
    ogImageHeight,
    ogImageType,
    ogUpdatedTime,
    imageAlt,
    twitterCard,
    sitemapPath,
    ldJsonPayload,
  ]);
};

export const SEO_ROBOTS_INDEX = DEFAULT_ROBOTS;
export const SEO_ROBOTS_NOINDEX = 'noindex, nofollow, noarchive';
export const getSiteUrl = getRuntimeSiteUrl;
