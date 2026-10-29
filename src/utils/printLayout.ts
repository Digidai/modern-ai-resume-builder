import { MM_TO_PX, PRINT_CONFIG } from '../constants/print';

export interface PrintLayout {
  /** Printed A4 pages. */
  pages: number;
  /** Where each page after the first begins, in mm from the top of the on-screen paper. */
  breaksMm: number[];
  /**
   * Height (px) that makes the printed paper end exactly at the bottom of its last page, so full-bleed
   * backgrounds reach the edge. Measured, because page frames repeat their padding on every page.
   */
  fillHeightPx: number;
  /** Share of the last page's height taken by content (1 for a one-page resume). */
  lastPageFill: number;
}

const { PAGE_WIDTH_MM, PAGE_HEIGHT_MM, MARGIN_STANDARD_MM } = PRINT_CONFIG;
const GAP_PX = 40;

/** Size of one printed page's content box: standard templates print inside 15mm margins, full-bleed ones edge to edge. */
export const pageBoxMm = (fullBleed: boolean) =>
  fullBleed
    ? { width: PAGE_WIDTH_MM, height: PAGE_HEIGHT_MM, inset: 0 }
    : { width: PAGE_WIDTH_MM - 2 * MARGIN_STANDARD_MM, height: PAGE_HEIGHT_MM - 2 * MARGIN_STANDARD_MM, inset: MARGIN_STANDARD_MM };

interface PaginatedCopy {
  host: HTMLElement;
  copy: HTMLElement;
  /** The copy's elements, index-aligned with the paper's (`[paper, ...paper.querySelectorAll('*')]`). */
  copies: HTMLElement[];
  columnWidthPx: number;
  columnHeightPx: number;
}

/**
 * An off-screen copy of the paper laid out in page-sized CSS columns. Chromium fragments columns and
 * printed pages with the same engine, so entries that avoid breaking, headings kept with their content,
 * side-by-side columns and page frames that repeat their padding (`box-decoration-break: clone`) all
 * land exactly where they will in the PDF. Mirrors the print CSS in ResumePreview.
 */
const createPaginatedCopy = (paper: HTMLElement, fullBleed: boolean, scale: number | undefined, visible: boolean): PaginatedCopy => {
  const box = pageBoxMm(fullBleed);
  const columnWidthPx = box.width * MM_TO_PX;
  const columnHeightPx = box.height * MM_TO_PX;

  const copy = paper.cloneNode(true) as HTMLElement;
  const copies = [copy, ...Array.from(copy.querySelectorAll<HTMLElement>('*'))];
  copy.removeAttribute('id');
  copy.querySelectorAll('[data-export-ignore="true"], style').forEach((node) => node.remove());
  Object.assign(copy.style, { minHeight: '0', padding: '0', overflow: 'visible', width: '100%', boxSizing: 'border-box', boxShadow: 'none' });
  const zoomBox = copy.querySelector<HTMLElement>('[data-resume-zoom]');
  if (scale !== undefined && zoomBox) zoomBox.style.zoom = String(scale);

  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  Object.assign(host.style, {
    position: 'fixed',
    left: '-100000px',
    top: '0',
    pointerEvents: 'none',
    width: `${columnWidthPx}px`,
    background: '#ffffff',
    // html-to-image copies computed styles, so an export copy is hidden with opacity (reset on the root) rather than visibility.
    ...(visible ? { opacity: '0' } : { visibility: 'hidden' }),
  });
  host.appendChild(copy);
  document.body.appendChild(host);
  return { host, copy, copies, columnWidthPx, columnHeightPx };
};

/**
 * Height for the copy that ends its background at the bottom of its last printed page: its unfragmented
 * height plus the space left below the boxes that paint page backgrounds (paper, template root, page
 * frames). Page frames repeat their padding on every page, so the result is refined by measuring, and it
 * never adds a page.
 */
const heightToFillLastPage = (paged: PaginatedCopy, naturalPx: number, pages: number) => {
  const { host, copy, columnHeightPx } = paged;
  const frames = [copy, ...Array.from(copy.querySelectorAll<HTMLElement>('[data-resume-zoom] > *, .page-frame'))];
  const lastBottom = () => {
    const top = host.getBoundingClientRect().top;
    return Math.max(
      ...frames.map((element) => {
        const rects = element.getClientRects();
        return rects.length ? rects[rects.length - 1].bottom - top : 0;
      })
    );
  };
  const previous = copy.style.minHeight;
  let good = 0;
  let extra = 0;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const gap = columnHeightPx - 1 - lastBottom();
    if (gap < 1) break;
    extra += gap;
    copy.style.minHeight = `${naturalPx + extra}px`;
    if (countPages(paged) !== pages) {
      // Overshot onto another page: keep the last height that didn't.
      extra = good;
      break;
    }
    good = extra;
  }
  copy.style.minHeight = previous;
  return naturalPx + good;
};

const applyColumns = ({ host, columnWidthPx, columnHeightPx }: PaginatedCopy) =>
  Object.assign(host.style, {
    height: `${columnHeightPx}px`,
    columnWidth: `${columnWidthPx}px`,
    columnGap: `${GAP_PX}px`,
    columnFill: 'auto',
  });

const countPages = ({ host, columnWidthPx }: PaginatedCopy) =>
  Math.max(1, Math.round((host.scrollWidth + GAP_PX) / (columnWidthPx + GAP_PX)));

/**
 * Paginates the paper the way printing does:
 * - standard templates: 15mm margins on every page, so each page holds 180×267mm of content.
 * - full-bleed templates: no page margins; the template's root (and any `.page-frame`) repeats its own
 *   padding and background on every page.
 * Pass `scale` to measure the resume at another text size without re-rendering it (break positions
 * are then in the copy's coordinates, so only use `pages`).
 */
export const measurePrintLayout = (paper: HTMLElement, fullBleed: boolean, scale?: number): PrintLayout => {
  const scaleToLayout = paper.offsetHeight / (paper.getBoundingClientRect().height || 1);
  const paged = createPaginatedCopy(paper, fullBleed, scale, false);
  const { host, copy, copies, columnWidthPx, columnHeightPx } = paged;
  const originals = [paper, ...Array.from(paper.querySelectorAll<HTMLElement>('*'))];

  try {
    // Unfragmented height first: a resume that fits needs no column layout.
    const naturalPx = copy.offsetHeight;
    if (naturalPx <= columnHeightPx + 2) return { pages: 1, breaksMm: [], fillHeightPx: columnHeightPx - 1, lastPageFill: 1 };
    applyColumns(paged);

    const hostRect = host.getBoundingClientRect();
    const columnOf = (rect: DOMRect) => Math.max(0, Math.floor((rect.left - hostRect.left + GAP_PX / 2) / (columnWidthPx + GAP_PX)));
    const pages = countPages(paged);

    // Each page break = the highest point (in on-screen paper coordinates) of any content that starts on
    // that page. Leaf elements can be split across pages, so walk their fragments.
    const paperTop = paper.getBoundingClientRect().top;
    const breaksPx: number[] = Array(pages).fill(Infinity);
    let lastPageBottom = 0;
    copies.forEach((element, index) => {
      if (element === copy || element.firstElementChild || !element.isConnected) return;
      const fragments = Array.from(element.getClientRects()).filter((rect) => rect.height > 0);
      if (!fragments.length) return;
      let offset = (originals[index].getBoundingClientRect().top - paperTop) * scaleToLayout;
      for (const rect of fragments) {
        const page = columnOf(rect);
        if (page > 0 && page < pages) breaksPx[page] = Math.min(breaksPx[page], offset);
        if (page === pages - 1) lastPageBottom = Math.max(lastPageBottom, rect.bottom - hostRect.top);
        offset += rect.height;
      }
    });
    const breaksMm = breaksPx.slice(1).map((px) => px / MM_TO_PX).filter(Number.isFinite);
    return {
      pages,
      breaksMm,
      fillHeightPx: fullBleed && scale === undefined ? heightToFillLastPage(paged, naturalPx, pages) : naturalPx,
      lastPageFill: Math.min(1, lastPageBottom / columnHeightPx),
    };
  } finally {
    host.remove();
  }
};

/**
 * Lays the paper out as printed pages for an image export: `render` receives the host (one page-sized
 * column per page, side by side with `gapPx` between) and its size, and must finish before the copy is removed.
 */
export const withPrintedPages = async <T,>(
  paper: HTMLElement,
  fullBleed: boolean,
  render: (host: HTMLElement, layout: { pages: number; columnWidthPx: number; columnHeightPx: number; gapPx: number }) => Promise<T>
): Promise<T> => {
  const paged = createPaginatedCopy(paper, fullBleed, undefined, true);
  try {
    const naturalPx = paged.copy.offsetHeight;
    applyColumns(paged);
    const pages = countPages(paged);
    // As in print: full-bleed papers fill their last page so backgrounds reach the bottom edge.
    if (fullBleed) paged.copy.style.minHeight = `${heightToFillLastPage(paged, naturalPx, pages)}px`;
    return await render(paged.host, { pages, columnWidthPx: paged.columnWidthPx, columnHeightPx: paged.columnHeightPx, gapPx: GAP_PX });
  } finally {
    paged.host.remove();
  }
};

/**
 * The largest text size (in whole percent, between `min` and `current`) at which the resume prints on
 * at most `pages` pages, measured off-screen so the preview doesn't flicker; null when even `min` is too big.
 */
export const largestScaleForPages = (paper: HTMLElement, fullBleed: boolean, current: number, min: number, pages = 1): number | null => {
  const fits = (percent: number) => measurePrintLayout(paper, fullBleed, percent / 100).pages <= pages;
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
