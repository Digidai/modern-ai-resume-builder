import { useEffect } from 'react';

type SeoConfig = {
  title: string;
  description: string;
  canonical?: string;
  robots?: string;
  ogType?: string;
  ogSiteName?: string;
  ogLocale?: string;
  ogImage?: string;
  imageAlt?: string;
  twitterCard?: string;
  ldJson?: Record<string, unknown>;
};

const DEFAULT_ROBOTS =
  'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';
const DEFAULT_OG_TYPE = 'website';
const DEFAULT_SITE_NAME = 'ModernCV';
const DEFAULT_LOCALE = 'en_US';
const DEFAULT_TWITTER_CARD = 'summary_large_image';
const DEFAULT_IMAGE_ALT = 'ModernCV - AI Resume Builder';

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

const toAbsoluteUrl = (value: string, origin: string) => {
  if (!value) return value;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) return `${origin}${value}`;
  return `${origin}/${value}`;
};

const buildCanonicalUrl = (canonical: string | undefined, origin: string) => {
  if (canonical) return toAbsoluteUrl(canonical, origin);
  const path = window.location.pathname || '/';
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
};

const ensureLdJson = (payload: string) => {
  let script = document.head.querySelector<HTMLScriptElement>('script[type="application/ld+json"]');
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = payload;
};

export const useSeo = ({
  title,
  description,
  canonical,
  robots,
  ogType,
  ogSiteName,
  ogLocale,
  ogImage,
  imageAlt,
  twitterCard,
  ldJson,
}: SeoConfig) => {
  const ldJsonPayload = ldJson ? JSON.stringify(ldJson, null, 2) : null;

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    const origin = window.location.origin;
    const canonicalUrl = buildCanonicalUrl(canonical, origin);
    const imageUrl = toAbsoluteUrl(ogImage ?? '/og-image.png', origin);
    const resolvedImageAlt = imageAlt ?? DEFAULT_IMAGE_ALT;

    document.title = title;

    setMetaContent('name', 'title', title);
    setMetaContent('name', 'description', description);
    setMetaContent('name', 'robots', robots ?? DEFAULT_ROBOTS);

    const canonicalLink = ensureLinkTag('canonical');
    canonicalLink.setAttribute('href', canonicalUrl);

    setMetaContent('property', 'og:url', canonicalUrl);
    setMetaContent('property', 'og:title', title);
    setMetaContent('property', 'og:description', description);
    setMetaContent('property', 'og:type', ogType ?? DEFAULT_OG_TYPE);
    setMetaContent('property', 'og:site_name', ogSiteName ?? DEFAULT_SITE_NAME);
    setMetaContent('property', 'og:locale', ogLocale ?? DEFAULT_LOCALE);
    setMetaContent('property', 'og:image', imageUrl);
    setMetaContent('property', 'og:image:alt', resolvedImageAlt);

    setMetaContent('name', 'twitter:card', twitterCard ?? DEFAULT_TWITTER_CARD);
    setMetaContent('name', 'twitter:url', canonicalUrl);
    setMetaContent('name', 'twitter:title', title);
    setMetaContent('name', 'twitter:description', description);
    setMetaContent('name', 'twitter:image', imageUrl);
    setMetaContent('name', 'twitter:image:alt', resolvedImageAlt);

    if (ldJsonPayload) {
      ensureLdJson(ldJsonPayload);
    }
  }, [
    title,
    description,
    canonical,
    robots,
    ogType,
    ogSiteName,
    ogLocale,
    ogImage,
    imageAlt,
    twitterCard,
    ldJsonPayload,
  ]);
};

export const SEO_ROBOTS_INDEX = DEFAULT_ROBOTS;
export const SEO_ROBOTS_NOINDEX = 'noindex, nofollow, noarchive';
