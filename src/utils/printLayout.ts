import { MM_TO_PX, PRINT_CONFIG } from '../constants/print';

export interface PrintLayout {
  /** Printed A4 pages. */
  pages: number;
  /** Where each page after the first begins, in mm from the top of the on-screen paper. */
  breaksMm: number[];
}

const { PAGE_WIDTH_MM, PAGE_HEIGHT_MM, MARGIN_STANDARD_MM, MARGIN_CONTINUATION_MM } = PRINT_CONFIG;
const GAP_PX = 40;

/**
 * Paginates the paper the way printing does, by laying out an off-screen copy in fixed-height CSS
 * columns: Chromium fragments columns and printed pages with the same engine, so `break-inside: avoid`
 * entries, headings kept with their content, and side-by-side columns all move exactly as they will
 * in the PDF. Mirrors the print CSS in ResumePreview:
 * - standard templates: 15mm margins on every page, so each page holds 180×267mm of content.
 * - full-bleed templates: one page has no margins; a longer resume gets a 12mm bottom margin on
 *   page 1 and 12mm top and bottom margins on later pages.
 * Pass `scale` to measure the resume at another text size without re-rendering it (break positions
 * are then in the copy's coordinates, so only use `pages`).
 */
export const measurePrintLayout = (paper: HTMLElement, fullBleed: boolean, scale?: number): PrintLayout => {
  const scaleToLayout = paper.offsetHeight / (paper.getBoundingClientRect().height || 1);
  const pageWidthMm = fullBleed ? PAGE_WIDTH_MM : PAGE_WIDTH_MM - 2 * MARGIN_STANDARD_MM;
  const columnHeightMm = fullBleed ? PAGE_HEIGHT_MM - 2 * MARGIN_CONTINUATION_MM : PAGE_HEIGHT_MM - 2 * MARGIN_STANDARD_MM;
  const columnWidthPx = pageWidthMm * MM_TO_PX;

  const clone = paper.cloneNode(true) as HTMLElement;
  // Pair every original element with its copy before removing screen-only nodes from the copy.
  const originals = [paper, ...Array.from(paper.querySelectorAll<HTMLElement>('*'))];
  const copies = [clone, ...Array.from(clone.querySelectorAll<HTMLElement>('*'))];
  clone.removeAttribute('id');
  clone.querySelectorAll('[data-export-ignore="true"], style').forEach((node) => node.remove());
  Object.assign(clone.style, { minHeight: '0', padding: '0', overflow: 'visible', width: '100%', boxSizing: 'border-box' });
  const zoomBox = clone.querySelector<HTMLElement>('[data-resume-zoom]');
  if (scale !== undefined && zoomBox) zoomBox.style.zoom = String(scale);

  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  Object.assign(host.style, {
    position: 'fixed',
    left: '-100000px',
    top: '0',
    visibility: 'hidden',
    pointerEvents: 'none',
    width: `${columnWidthPx}px`,
  });
  // Full-bleed page 1 starts at the paper edge and runs to its 12mm bottom margin: let the first
  // column hold that extra 12mm by starting the content above the column box.
  const shell = document.createElement('div');
  if (fullBleed) shell.style.marginTop = `${-MARGIN_CONTINUATION_MM * MM_TO_PX}px`;
  shell.appendChild(clone);
  host.appendChild(shell);
  document.body.appendChild(host);

  try {
    // Unfragmented height first: a resume that fits needs no column layout.
    const naturalMm = clone.offsetHeight / MM_TO_PX;
    if (naturalMm <= (fullBleed ? PAGE_HEIGHT_MM : columnHeightMm) + 0.5) return { pages: 1, breaksMm: [] };
    Object.assign(host.style, {
      height: `${columnHeightMm * MM_TO_PX}px`,
      columnWidth: `${columnWidthPx}px`,
      columnGap: `${GAP_PX}px`,
      columnFill: 'auto',
    });

    const hostRect = host.getBoundingClientRect();
    const columnOf = (rect: DOMRect) => Math.max(0, Math.floor((rect.left - hostRect.left + GAP_PX / 2) / (columnWidthPx + GAP_PX)));
    const pages = Math.max(1, Math.round((host.scrollWidth + GAP_PX) / (columnWidthPx + GAP_PX)));

    // Each page break = the highest point (in on-screen paper coordinates) of any content that
    // starts on that page. Leaf elements can be split across pages, so walk their fragments.
    const paperTop = paper.getBoundingClientRect().top;
    const breaksPx: number[] = Array(pages).fill(Infinity);
    copies.forEach((copy, index) => {
      if (copy === clone || copy.firstElementChild || !copy.isConnected) return;
      const original = originals[index];
      const fragments = Array.from(copy.getClientRects()).filter((rect) => rect.height > 0);
      if (!fragments.length) return;
      let offset = (original.getBoundingClientRect().top - paperTop) * scaleToLayout;
      for (const rect of fragments) {
        const page = columnOf(rect);
        if (page > 0 && page < pages) breaksPx[page] = Math.min(breaksPx[page], offset);
        offset += rect.height;
      }
    });
    const breaksMm = breaksPx.slice(1).map((px) => px / MM_TO_PX).filter(Number.isFinite);
    return { pages, breaksMm };
  } finally {
    host.remove();
  }
};

/**
 * The largest text size (in whole percent, between `min` and `current`) at which the resume prints on
 * one page, measured off-screen so the preview doesn't flicker; null when even `min` is too big.
 */
export const largestOnePageScale = (paper: HTMLElement, fullBleed: boolean, current: number, min: number): number | null => {
  const fits = (percent: number) => measurePrintLayout(paper, fullBleed, percent / 100).pages === 1;
  let low = Math.ceil(min * 100 - 1e-6);
  let high = Math.round(current * 100);
  if (fits(high)) return high / 100;
  if (!fits(low)) return null;
  // fits(low) && !fits(high): binary search for the boundary.
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    if (fits(mid)) low = mid;
    else high = mid;
  }
  return low / 100;
};
