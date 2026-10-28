export const PRINT_CONFIG = {
  PAGE_WIDTH_MM: 210,
  PAGE_HEIGHT_MM: 297,
  MARGIN_STANDARD_MM: 15,
  MARGIN_FULL_BLEED_MM: 0,
  /** Full-bleed templates own page 1's margins; when they run longer, later pages get this top and bottom margin. */
  MARGIN_CONTINUATION_MM: 12,
} as const;

export const A4_DIMENSIONS = {
  WIDTH_PT: 595.28,
  HEIGHT_PT: 841.89,
} as const;

export const MM_TO_PX = 96 / 25.4;
export const PAGE_HEIGHT_PX = PRINT_CONFIG.PAGE_HEIGHT_MM * MM_TO_PX;

/**
 * Where each printed page ends, measured from the top of the on-screen paper (mm), for a paper of
 * `heightMm`. Mirrors the print CSS in ResumePreview:
 * - standard templates: the screen paper has 15mm padding; print uses 15mm @page margins on every page,
 *   so each page holds 267mm of content.
 * - full-bleed templates: one page has no margins; a longer resume gets a bottom margin on page 1 and
 *   top + bottom margins on later pages.
 * Entries that avoid breaking inside can push content a little further, so treat counts as a close estimate.
 */
export const pageBreaksMm = (heightMm: number, fullBleed: boolean): number[] => {
  const { PAGE_HEIGHT_MM: page, MARGIN_STANDARD_MM: std, MARGIN_CONTINUATION_MM: cont } = PRINT_CONFIG;
  const eps = 0.5;
  if (!fullBleed) {
    const perPage = page - 2 * std;
    const content = Math.max(0, heightMm - 2 * std);
    const breaks: number[] = [];
    for (let end = perPage; end < content - eps; end += perPage) breaks.push(std + end);
    return breaks;
  }
  if (heightMm <= page + eps) return [];
  const breaks = [page - cont];
  for (let end = page - cont + (page - 2 * cont); end < heightMm - eps; end += page - 2 * cont) breaks.push(end);
  return breaks;
};

/** Printed pages for a paper of `heightPx` (screen layout). */
export const printedPages = (heightPx: number, fullBleed: boolean) => pageBreaksMm(heightPx / MM_TO_PX, fullBleed).length + 1;

