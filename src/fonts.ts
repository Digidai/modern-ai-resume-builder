// Self-hosted fonts for the resume paper. Every template uses these (never system fonts) so the
// preview, every OS, and the server-rendered PDF all look identical.
// Static (not variable) faces: Chromium embeds variable fonts in PDFs as Type 3 glyphs, which
// render soft in PDF viewers and parse poorly in ATS; static faces embed as TrueType. Families that
// had no italic before keep the browser's synthesized oblique.
//
// All families together are about 600 @font-face rules (~120 KB gzipped), so each family is its own
// stylesheet, loaded after the page once something on it uses that family. The site's own Inter faces
// are in the render-blocking CSS (src/index.tsx). Resume text shows in a fallback font until its
// family's rules and files arrive, as it does with `font-display: swap` anyway.
const FAMILIES: Record<string, () => Promise<unknown>> = {
  Inter: () => import('./resumeFonts/inter'),
  'Source Sans 3': () => import('./resumeFonts/source-sans-3'),
  'Source Serif 4': () => import('./resumeFonts/source-serif-4'),
  Roboto: () => import('./resumeFonts/roboto'),
  Raleway: () => import('./resumeFonts/raleway'),
  Montserrat: () => import('./resumeFonts/montserrat'),
  'EB Garamond': () => import('./resumeFonts/eb-garamond'),
  'Playfair Display': () => import('./resumeFonts/playfair-display'),
  'JetBrains Mono': () => import('./resumeFonts/jetbrains-mono'),
  Lato: () => import('./resumeFonts/lato'),
  Tinos: () => import('./resumeFonts/tinos'),
  'Charis SIL': () => import('./resumeFonts/charis-sil'),
  'IBM Plex Serif': () => import('./resumeFonts/ibm-plex-serif'),
  'Latin Modern Roman': () => import('./resumeFonts/latin-modern'),
};

const loading = new Map<string, Promise<unknown>>();
const loadFamily = (family: string): Promise<unknown> => {
  let promise = loading.get(family);
  if (!promise) {
    // A failed load (offline, stale deploy) is retried the next time the family is seen.
    promise = FAMILIES[family]().catch(() => loading.delete(family));
    loading.set(family, promise);
  }
  return promise;
};

// Elements that can set a resume font: the paper, anything inside it with a font utility class, and
// the site's monospace labels. Other elements inherit from one of these.
const FONT_SETTERS = '.resume-paper, .resume-paper [class*="font-"], .font-label';

/** Loads the stylesheets of the families that elements in `root` (or `root` itself) render in. */
const loadUsedFamilies = (root: Document | Element): Promise<unknown> => {
  const elements = Array.from(root.querySelectorAll(FONT_SETTERS));
  if (root instanceof Element && root.matches(FONT_SETTERS)) elements.push(root);
  const families = new Set<string>();
  for (const element of elements) {
    // Only the first family of a stack matters; the rest are fallbacks for missing glyphs.
    const family = getComputedStyle(element).fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, '');
    if (family in FAMILIES) families.add(family);
  }
  return Promise.all(Array.from(families, loadFamily));
};

/** Loads the fonts the page uses now, then those of resumes and templates that appear or change later. */
export const watchResumeFonts = (): void => {
  void loadUsedFamilies(document);
  let pending: Element[] = [];
  new MutationObserver((records) => {
    const first = pending.length === 0;
    for (const record of records) {
      if (record.type === 'attributes') pending.push(record.target as Element);
      else for (const node of record.addedNodes) if (node instanceof Element) pending.push(node);
    }
    if (!first || pending.length === 0) return;
    requestAnimationFrame(() => {
      const elements = pending;
      pending = [];
      for (const element of elements) if (element.isConnected) void loadUsedFamilies(element);
    });
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
};

/** Resolves once the resume fonts the page uses have loaded (for measuring, PDFs and the agent renderer). */
export const resumeFontsReady = async (): Promise<void> => {
  // No font loading to wait for (prerendering, tests).
  if (typeof document === 'undefined' || !document.fonts) return;
  await loadUsedFamilies(document);
  // Lay the page out with the new rules, which starts the font loads `fonts.ready` then waits for.
  void document.body?.offsetHeight;
  await document.fonts.ready;
};
