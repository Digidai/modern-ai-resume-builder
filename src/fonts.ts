// The resume fonts' stylesheet (about 600 @font-face rules, ~120 KB gzipped) is loaded after the
// page, not as part of the render-blocking CSS; the site's own Inter faces are in that CSS
// (src/index.tsx). Resume text shows in a fallback font until both the rules and the files arrive,
// as it does with `font-display: swap` anyway.
let loading: Promise<unknown> | undefined;
export const loadResumeFonts = (): Promise<unknown> => (loading ??= import('./resumeFonts').catch(() => undefined));

/** Resolves once the resume fonts the page uses have loaded (for measuring, PDFs and the agent renderer). */
export const resumeFontsReady = async (): Promise<void> => {
  // No font loading to wait for (prerendering, tests).
  if (typeof document === 'undefined' || !document.fonts) return;
  await loadResumeFonts();
  // Lay the page out with the new rules, which starts the font loads `fonts.ready` then waits for.
  void document.body?.offsetHeight;
  await document.fonts.ready;
};
