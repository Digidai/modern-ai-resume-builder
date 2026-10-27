import { postWithAiSession } from '../services/aiService';

const stripQuotes = (value: string) => value.trim().replace(/^["']|["']$/g, '');

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

/** Font families (first-class names) used anywhere inside the element. */
const collectUsedFamilies = (root: HTMLElement): Set<string> => {
  const families = new Set<string>();
  for (const el of [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))]) {
    for (const name of getComputedStyle(el).fontFamily.split(',')) families.add(stripQuotes(name));
  }
  return families;
};

/** True when the browser actually loaded this face (so the PDF needs the same subset). */
const isFaceLoaded = (rule: CSSFontFaceRule): boolean => {
  const family = stripQuotes(rule.style.getPropertyValue('font-family'));
  const range = rule.style.getPropertyValue('unicode-range').replace(/\s/g, '').toLowerCase();
  const style = rule.style.getPropertyValue('font-style') || 'normal';
  for (const face of document.fonts) {
    if (stripQuotes(face.family) !== family || face.status !== 'loaded') continue;
    if (range && face.unicodeRange.replace(/\s/g, '').toLowerCase() !== range) continue;
    if (face.style !== style) continue;
    return true;
  }
  return false;
};

const inlineFontFace = async (rule: CSSFontFaceRule, baseUrl: string): Promise<string | null> => {
  const match = /url\(["']?([^"')]+)["']?\)/.exec(rule.style.getPropertyValue('src'));
  if (!match) return null;
  const response = await fetch(new URL(match[1], baseUrl));
  if (!response.ok) return null;
  const dataUrl = await blobToDataUrl(await response.blob());
  return rule.cssText.replace(/src:[^;]+;/, `src: url("${dataUrl}") format("woff2");`);
};

/**
 * Snapshot of the rendered paper: its markup plus every same-origin CSS rule, with the
 * fonts it uses inlined as data: URLs (the render sandbox has no network access).
 */
export const buildPdfSnapshot = async (element: HTMLElement): Promise<{ html: string; css: string }> => {
  await document.fonts.ready;
  const usedFamilies = collectUsedFamilies(element);
  const cssParts: string[] = [];
  const fontJobs: Promise<string | null>[] = [];

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // cross-origin sheet
    }
    const baseUrl = sheet.href || window.location.href;
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSFontFaceRule) {
        const family = stripQuotes(rule.style.getPropertyValue('font-family'));
        if (usedFamilies.has(family) && isFaceLoaded(rule)) fontJobs.push(inlineFontFace(rule, baseUrl));
      } else {
        cssParts.push(rule.cssText);
      }
    }
  }

  const fonts = (await Promise.all(fontJobs)).filter((face): face is string => !!face);
  const clone = element.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('[data-export-ignore="true"]').forEach((node) => node.remove());
  clone.removeAttribute('id');
  return { html: clone.outerHTML, css: [...fonts, ...cssParts].join('\n') };
};

/** Renders the paper to a vector PDF on the server (Cloudflare Browser Rendering). */
export const renderPdfOnServer = async (element: HTMLElement): Promise<Blob> => {
  const snapshot = await buildPdfSnapshot(element);
  const response = await postWithAiSession('/api/pdf', JSON.stringify(snapshot));
  const blob = await response.blob();
  if (blob.type !== 'application/pdf' || blob.size < 500) throw new Error('Unexpected PDF response');
  return blob;
};
