import { MM_TO_PX, PRINT_CONFIG, paperSize } from '../constants/print';

export interface PrintLayout {
  /** Printed pages. */
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

const { MARGIN_STANDARD_MM } = PRINT_CONFIG;
const GAP_PX = 40;

/** The paper size a rendered paper prints on, from its `data-paper` (set by ResumePreview). */
export const paperOf = (paper: HTMLElement) => paperSize(paper.dataset.paper);

/** Size of one printed page's content box: standard templates print inside 15mm margins, full-bleed ones edge to edge. */
export const pageBoxMm = (fullBleed: boolean, paper: string | undefined = 'a4') => {
  const { widthMm, heightMm } = paperSize(paper);
  return fullBleed
    ? { width: widthMm, height: heightMm, inset: 0 }
    : { width: widthMm - 2 * MARGIN_STANDARD_MM, height: heightMm - 2 * MARGIN_STANDARD_MM, inset: MARGIN_STANDARD_MM };
};

interface PaginatedCopy {
  host: HTMLElement;
  copy: HTMLElement;
  /** The copy's elements, index-aligned with the paper's (`[paper, ...paper.querySelectorAll('*')]`). */
  copies: HTMLElement[];
  columnWidthPx: number;
  columnHeightPx: number;
  /**
   * Safari model only: the frames' bottom space. Once a frame is split across pages, Chromium lets its
   * trailing padding run past the bottom of its last page instead of starting another page.
   */
  trailingSpacePx: number;
}

/**
 * An off-screen copy of the paper laid out in page-sized CSS columns. Chromium fragments columns and
 * printed pages with the same engine, so entries that avoid breaking, headings kept with their content,
 * side-by-side columns and page frames that repeat their padding (`box-decoration-break: clone`) all
 * land exactly where they will in the PDF. Mirrors the print CSS in ResumePreview.
 */
const createPaginatedCopy = (paper: HTMLElement, fullBleed: boolean, scale: number | undefined, visible: boolean): PaginatedCopy => {
  const box = pageBoxMm(fullBleed, paper.dataset.paper);
  const columnWidthPx = box.width * MM_TO_PX;
  let columnHeightPx = box.height * MM_TO_PX;
  let trailingSpacePx = 0;

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
  if (MONOLITHIC_GRID_ROWS) flattenGrids(copy);
  if (!SUPPORTS_CLONE) flattenColumnFlexboxes(copy);
  if (fullBleed && !SUPPORTS_CLONE && !visible) {
    // Safari doesn't repeat frames on each page, so measure without them on pages shortened by the space
    // they take: page 1 then holds what it holds in print (top and bottom space plus content), as does every other.
    const space = repeatedFrameSpace(copy, true);
    columnHeightPx -= space.top + space.bottom;
    trailingSpacePx = space.bottom;
  }
  return { host, copy, copies, columnWidthPx, columnHeightPx, trailingSpacePx };
};

/** Whether this browser repeats a block's padding and borders on every column or page it spans (not Safari). */
export const SUPPORTS_CLONE = typeof CSS !== 'undefined' && CSS.supports('box-decoration-break', 'clone');

/**
 * The space page frames (the full-bleed template root and any `.page-frame`) repeat at the top and bottom of
 * every printed page: their vertical padding and borders, nested frames added up, side-by-side frames
 * taking the largest. With `strip`, also removes that space from the frames.
 */
export const repeatedFrameSpace = (root: HTMLElement, strip = false): { top: number; bottom: number } => {
  const frames = Array.from(root.querySelectorAll<HTMLElement>('[data-resume-zoom] > *, .page-frame'));
  // Lengths inside the zoom box are scaled by its zoom (the text size setting).
  const zoom = parseFloat(root.querySelector<HTMLElement>('[data-resume-zoom]')?.style.zoom || '') || 1;
  const own = new Map<HTMLElement, { top: number; bottom: number }>();
  for (const frame of frames) {
    const style = getComputedStyle(frame);
    own.set(frame, {
      top: ((parseFloat(style.paddingTop) || 0) + (parseFloat(style.borderTopWidth) || 0)) * zoom,
      bottom: ((parseFloat(style.paddingBottom) || 0) + (parseFloat(style.borderBottomWidth) || 0)) * zoom,
    });
  }
  if (strip) frames.forEach((frame) => Object.assign(frame.style, { paddingTop: '0', paddingBottom: '0', borderTopWidth: '0', borderBottomWidth: '0' }));
  const total = (frame: HTMLElement, side: 'top' | 'bottom'): number => {
    const outer = frame.parentElement?.closest<HTMLElement>('.page-frame, [data-resume-zoom] > *');
    return (own.get(frame)?.[side] ?? 0) + (outer && own.has(outer) ? total(outer, side) : 0);
  };
  return {
    top: Math.max(0, ...frames.map((frame) => total(frame, 'top'))),
    bottom: Math.max(0, ...frames.map((frame) => total(frame, 'bottom'))),
  };
};

/**
 * Safari (the engine without `clone`) ignores `break-inside: avoid` on flex items, so it splits entries
 * that print whole. Rebuilds every column flexbox in the copy as block layout with the same geometry: each
 * item at its measured offset and width, and a formatting context of its own, as flex items have.
 */
const flattenColumnFlexboxes = (root: HTMLElement) => {
  const boxes = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))].filter((element) => {
    const style = getComputedStyle(element);
    return element.children.length > 0 && style.display.endsWith('flex') && style.flexDirection.startsWith('column');
  });
  const plans = boxes.map((box) => {
    const rect = box.getBoundingClientRect();
    const style = getComputedStyle(box);
    const left = rect.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft);
    let previous = rect.top + parseFloat(style.borderTopWidth) + parseFloat(style.paddingTop);
    const items = Array.from(box.children as HTMLCollectionOf<HTMLElement>)
      .filter((item) => {
        const { display, position } = getComputedStyle(item);
        return display !== 'none' && position !== 'absolute' && position !== 'fixed';
      })
      .map((item) => {
        const itemRect = item.getBoundingClientRect();
        const plan = { item, marginTop: itemRect.top - previous, marginLeft: itemRect.left - left, width: itemRect.width, block: getComputedStyle(item).display === 'block' };
        previous = itemRect.bottom;
        return plan;
      });
    return { box, items };
  });
  for (const { box, items } of plans) {
    box.style.display = 'block';
    for (const { item, marginTop, marginLeft, width, block } of items) {
      Object.assign(item.style, { boxSizing: 'border-box', width: `${width}px`, margin: `${marginTop}px 0 0 ${marginLeft}px` });
      if (block) item.style.display = 'flow-root';
    }
  }
};

/**
 * Firefox can't split a grid row across columns or pages, so a section laid out as a grid (label column
 * beside a long list of entries) jumps whole to the next page, while Chromium, which prints, splits it.
 */
const MONOLITHIC_GRID_ROWS = typeof navigator !== 'undefined' && /\bFirefox\//.test(navigator.userAgent);

/**
 * Rebuilds every grid and row flexbox in the copy as the same geometry in block layout, which Firefox does
 * split: each row becomes a box holding its tallest item in normal flow and the others pinned beside it
 * at their measured positions and widths.
 */
const flattenGrids = (root: HTMLElement) => {
  const grids = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))].filter((element) => {
    if (!element.children.length) return false;
    const style = getComputedStyle(element);
    return style.display.endsWith('grid') || (style.display.endsWith('flex') && style.flexDirection.startsWith('row'));
  });
  // Measure everything first: rebuilding a grid keeps its items' widths, so nested measurements stay valid.
  const plans = grids.map((grid) => {
    const box = grid.getBoundingClientRect();
    const style = getComputedStyle(grid);
    const left = box.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft);
    // Border boxes, so items keep their exact place once their own margins are dropped.
    const items = Array.from(grid.children as HTMLCollectionOf<HTMLElement>)
      .filter((item) => {
        const { display, position } = getComputedStyle(item);
        return display !== 'none' && position !== 'absolute' && position !== 'fixed';
      })
      .map((item) => {
        const rect = item.getBoundingClientRect();
        // Rows stretch their items to the same height; the content's own height decides which one flows.
        const align = item.style.alignSelf;
        item.style.alignSelf = 'start';
        const contentHeight = item.getBoundingClientRect().height;
        item.style.alignSelf = align;
        return { item, x: rect.left - left, top: rect.top, width: rect.width, height: rect.height, contentHeight };
      });
    // Items that overlap vertically share a row (baseline-aligned flex items start at different heights).
    const rows: (typeof items)[] = [];
    let rowBottom = -Infinity;
    for (const entry of [...items].sort((a, b) => a.top - b.top || a.x - b.x)) {
      const bottom = entry.top + entry.height;
      if (rows.length && entry.top < rowBottom - 1) {
        rows[rows.length - 1].push(entry);
        rowBottom = Math.max(rowBottom, bottom);
      } else {
        rows.push([entry]);
        rowBottom = bottom;
      }
    }
    return { grid, rows };
  });

  for (const { grid, rows } of plans) {
    grid.style.display = 'block';
    let previousBottom: number | null = null;
    for (const row of rows) {
      const rowTop = Math.min(...row.map((entry) => entry.top));
      const wrapper = document.createElement('div');
      Object.assign(wrapper.style, { display: 'flow-root', position: 'relative' });
      if (previousBottom !== null) wrapper.style.marginTop = `${rowTop - previousBottom}px`;
      previousBottom = Math.max(...row.map((entry) => entry.top + entry.height));
      // The tallest item stays in normal flow (it's what spans pages); the others are pinned beside it.
      const flow = row.reduce((tallest, entry) => (entry.contentHeight > tallest.contentHeight ? entry : tallest));
      for (const entry of row) {
        const pinned = entry !== flow;
        Object.assign(entry.item.style, {
          boxSizing: 'border-box',
          width: `${entry.width}px`,
          margin: pinned ? '0' : `${entry.top - rowTop}px 0 0 ${entry.x}px`,
          ...(pinned ? { position: 'absolute', left: `${entry.x}px`, top: `${entry.top - rowTop}px`, height: `${entry.height}px` } : {}),
        });
        wrapper.appendChild(entry.item);
      }
      grid.appendChild(wrapper);
    }
  }
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

/** The copy's exact unfragmented height (offsetHeight rounds to whole pixels; the copy is never transformed). */
const naturalHeight = (copy: HTMLElement) => copy.getBoundingClientRect().height;

/**
 * Whether an unfragmented copy prints on one page without laying it out in columns: only when it is no taller
 * than the page box. Chromium prints a second page for some overflows well under a pixel (0.54px in one
 * template, 0.76px in another), so there is no slack: anything taller is counted in columns, which start
 * another one at any overflow (so a fraction of a pixel over may count a page more than prints, never fewer).
 */
const fitsOnePage = (naturalPx: number, columnHeightPx: number) => naturalPx <= columnHeightPx;

/**
 * Paginates the paper the way printing does:
 * - standard templates: 15mm margins on every page (on A4 each page holds 180×267mm of content).
 * - full-bleed templates: no page margins; the template's root (and any `.page-frame`) repeats its own
 *   padding and background on every page.
 * Pass `scale` to measure the resume at another text size without re-rendering it (break positions
 * are then in the copy's coordinates, so only use `pages`).
 */
export const measurePrintLayout = (paper: HTMLElement, fullBleed: boolean, scale?: number): PrintLayout => {
  const scaleToLayout = paper.offsetHeight / (paper.getBoundingClientRect().height || 1);
  const paged = createPaginatedCopy(paper, fullBleed, scale, false);
  const { host, copy, copies, columnWidthPx, columnHeightPx, trailingSpacePx } = paged;
  const originals = [paper, ...Array.from(paper.querySelectorAll<HTMLElement>('*'))];

  try {
    // Unfragmented height first: a resume that fits needs no column layout.
    const naturalPx = naturalHeight(copy);
    if (fitsOnePage(naturalPx, columnHeightPx)) return { pages: 1, breaksMm: [], fillHeightPx: columnHeightPx - 1, lastPageFill: 1 };
    // Unsplit tops of the leaves, for the trailing-space check below (Safari model only).
    // Absolutely positioned decorations (timeline rules) are left out: they stretch to fill pages.
    const unsplitTops =
      trailingSpacePx > 0
        ? copies.map((element) => (element.firstElementChild || getComputedStyle(element).position === 'absolute' ? NaN : element.getBoundingClientRect().top))
        : [];
    applyColumns(paged);

    const hostRect = host.getBoundingClientRect();
    const columnOf = (rect: DOMRect) => Math.max(0, Math.floor((rect.left - hostRect.left + GAP_PX / 2) / (columnWidthPx + GAP_PX)));
    let pages = countPages(paged);
    const pageBottom: number[] = Array(pages).fill(0);
    const pageUnsplitBottom: number[] = Array(pages).fill(0);

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
      let unsplitBottom = unsplitTops.length ? unsplitTops[index] : NaN;
      for (const rect of fragments) {
        unsplitBottom += rect.height;
        const page = columnOf(rect);
        if (page > 0 && page < pages) breaksPx[page] = Math.min(breaksPx[page], offset);
        if (page === pages - 1) lastPageBottom = Math.max(lastPageBottom, rect.bottom - hostRect.top);
        if (page < pages && Number.isFinite(unsplitBottom)) {
          pageBottom[page] = Math.max(pageBottom[page], rect.bottom - hostRect.top);
          pageUnsplitBottom[page] = Math.max(pageUnsplitBottom[page], unsplitBottom);
        }
        offset += rect.height;
      }
    });
    // The last page's content would fit on the page before (itself not the first), whose frame then ends
    // with its padding past the bottom: Chromium prints that without another page.
    if (trailingSpacePx > 0 && pages > 2) {
      const last = pages - 1;
      const needed = pageBottom[last - 1] + (pageUnsplitBottom[last] - pageUnsplitBottom[last - 1]);
      if (needed <= columnHeightPx + trailingSpacePx) {
        pages = last;
        breaksPx.length = pages;
        lastPageBottom = needed;
      }
    }
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
 * Lays the paper out as printed pages for an image export: `render` receives the layout (one page-sized
 * column per page, side by side with `gapPx` between) and must finish before the copies are removed.
 * `pageHost(index)` is an attached host showing page `index` in its column `index`: a copy cut down to that
 * page where that lays out the same (see prunedPages, attached until the next call), else the full copy.
 */
export const withPrintedPages = async <T,>(
  paper: HTMLElement,
  fullBleed: boolean,
  render: (layout: { pages: number; columnWidthPx: number; columnHeightPx: number; gapPx: number; pageHost: (index: number) => HTMLElement }) => Promise<T>
): Promise<T> => {
  const paged = createPaginatedCopy(paper, fullBleed, undefined, true);
  let attached: HTMLElement | null = null;
  try {
    const naturalPx = naturalHeight(paged.copy);
    applyColumns(paged);
    const pages = countPages(paged);
    // As in print: full-bleed papers fill their last page so backgrounds reach the bottom edge.
    if (fullBleed) paged.copy.style.minHeight = `${heightToFillLastPage(paged, naturalPx, pages)}px`;
    const pruned = prunedPages(paged, pages);
    const pageHost = (index: number) => {
      attached?.remove();
      attached = pruned[index];
      if (!attached) return paged.host;
      document.body.appendChild(attached);
      return attached;
    };
    return await render({ pages, columnWidthPx: paged.columnWidthPx, columnHeightPx: paged.columnHeightPx, gapPx: GAP_PX, pageHost });
  } finally {
    (attached as HTMLElement | null)?.remove();
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

/**
 * Safari reports one client rect for a block split across columns, so the fill can't be measured from
 * fragments there: find the tallest copy that still lays out on `pages` columns instead.
 */
const tallestWithPages = (paged: PaginatedCopy, pages: number) => {
  // Flattened flexboxes no longer stretch children, so grow the template root (which paints the
  // backgrounds) rather than the paper. Lengths there are in its zoomed units; only the page count matters.
  const target = paged.copy.querySelector<HTMLElement>('[data-resume-zoom] > *') ?? paged.copy;
  let low = 0;
  let high = 2 * pages * paged.columnHeightPx;
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    target.style.minHeight = `${mid}px`;
    if (countPages(paged) === pages) low = mid;
    else high = mid;
  }
  target.style.minHeight = `${Math.max(0, low - 1)}px`;
};

/** One box (fragment) of an element in the paginated copy, relative to the host; `column` is its page. */
interface PageBox {
  column: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * How a sheet's copy can be cut down below an element: `flow` (block or column flexbox of block-level
 * children) replaces children off the sheet by empty boxes of the same height, `grid` (grids and row
 * flexboxes) by an empty copy of each child at its size, and `leaf` (inline content, floats, numbered
 * lists, anything else) is copied whole.
 */
type PruneMode = 'flow' | 'grid' | 'leaf';

/** Larger differences between a cut-down sheet and the full copy fall back to the full copy. */
const SHEET_TOLERANCE_PX = 0.5;

/** Unnumbered list markers (numbered ones count their siblings, so those lists aren't cut down). */
const PLAIN_MARKERS = new Set(['none', 'disc', 'circle', 'square', 'disclosure-open', 'disclosure-closed']);

/**
 * Measures the copy laid out in columns, for cutting each sheet down to its own page: every element's
 * boxes, the range of pages it or its descendants touch, and the styles the empty stand-ins copy.
 */
const measureForSheets = ({ host, copy, columnWidthPx }: PaginatedCopy) => {
  const elements: Element[] = [copy, ...Array.from(copy.querySelectorAll('*'))];
  const indexOf = new Map(elements.map((element, index) => [element, index]));
  const hostRect = host.getBoundingClientRect();
  const columnAt = (left: number) => Math.max(0, Math.floor((left + GAP_PX / 2) / (columnWidthPx + GAP_PX)));
  const boxesOf = (element: Element, origin: DOMRect): PageBox[] =>
    Array.from(element.getClientRects())
      .filter((rect) => rect.width > 0 || rect.height > 0)
      .map((rect) => ({ column: columnAt(rect.left - origin.left), left: rect.left - origin.left, top: rect.top - origin.top, width: rect.width, height: rect.height }));
  const boxes = elements.map((element) => boxesOf(element, hostRect));
  const first = boxes.map((own) => Math.min(...own.map((box) => box.column)));
  const last = boxes.map((own) => Math.max(...own.map((box) => box.column)));
  for (let index = elements.length - 1; index > 0; index -= 1) {
    const parent = indexOf.get(elements[index].parentElement!)!;
    first[parent] = Math.min(first[parent], first[index]);
    last[parent] = Math.max(last[parent], last[index]);
  }
  const styles = elements.map((element) => getComputedStyle(element));
  const outOfFlow = styles.map((style) => style.position === 'absolute' || style.position === 'fixed');
  const mode = elements.map((element, index): PruneMode => {
    const style = styles[index];
    if (style.columnCount !== 'auto' || style.columnWidth !== 'auto') return 'leaf';
    const flow = ['block', 'flow-root', 'list-item'].includes(style.display) || (style.display === 'flex' && style.flexDirection === 'column' && style.flexWrap === 'nowrap');
    const grid = style.display === 'grid' || (style.display === 'flex' && style.flexDirection === 'row');
    if (!flow && !grid) return 'leaf';
    for (const node of Array.from(element.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE && /\S/.test(node.textContent ?? '')) return 'leaf';
      const child = node instanceof Element ? indexOf.get(node) : undefined;
      if (child === undefined) continue;
      const childStyle = styles[child];
      if (outOfFlow[child] || childStyle.display === 'none') continue;
      if (childStyle.display === 'contents' || childStyle.display.startsWith('inline') || childStyle.float !== 'none' || childStyle.order !== '0') return 'leaf';
      if (childStyle.display === 'list-item' && !PLAIN_MARKERS.has(childStyle.listStyleType)) return 'leaf';
    }
    return flow ? 'flow' : 'grid';
  });
  return {
    elements,
    indexOf,
    boxes,
    first,
    last,
    mode,
    outOfFlow,
    margins: styles.map((style) => ({ top: style.marginTop, bottom: style.marginBottom, before: style.breakBefore, after: style.breakAfter })),
    boxesOf,
  };
};

/** An invisible block that takes up space in the flow. */
const standIn = (style: Partial<CSSStyleDeclaration>) => {
  const box = document.createElement('div');
  Object.assign(box.style, { display: 'block', visibility: 'hidden', boxSizing: 'border-box', padding: '0', border: '0', flex: 'none', ...style });
  return box;
};

/**
 * The copy cut down to what shows on page `page` (0-based): elements whose boxes touch that page are kept
 * (with their ancestors); in a flow, each run of siblings on one earlier page becomes one empty box of their
 * height, margins and break rules (so later content breaks as before), and everything after the page becomes
 * one empty box a page tall (so containers still continue past it); in grids and rows, each child off the page
 * becomes an empty copy of itself at its size. `kept` pairs the copied elements with the originals' indexes.
 */
const pruneToPage = (measured: ReturnType<typeof measureForSheets>, page: number, columnHeightPx: number) => {
  const { elements, indexOf, boxes, first, last, mode, outOfFlow, margins } = measured;
  const kept: [number, Element][] = [];
  const whole = (index: number) => {
    const clone = elements[index].cloneNode(true) as Element;
    kept.push([index, clone]);
    return clone;
  };
  const sized = (index: number) => {
    const clone = elements[index].cloneNode(false) as HTMLElement;
    clone.removeAttribute('id');
    const own = boxes[index];
    Object.assign(clone.style, {
      boxSizing: 'border-box',
      width: `${own[0]?.width ?? 0}px`,
      height: `${own.reduce((sum, box) => sum + box.height, 0)}px`,
      minWidth: '0',
      minHeight: '0',
      maxWidth: 'none',
      maxHeight: 'none',
      flex: '0 0 auto',
      visibility: 'hidden',
    });
    return clone;
  };
  const build = (index: number): Element => {
    const out = elements[index].cloneNode(false) as Element;
    kept.push([index, out]);
    let run: number[] = [];
    const flush = () => {
      if (!run.length) return;
      const top = Math.min(...run.map((child) => boxes[child][0].top));
      const bottom = Math.max(...run.map((child) => boxes[child][0].top + boxes[child][0].height));
      const head = margins[run[0]];
      const tail = margins[run[run.length - 1]];
      out.appendChild(standIn({ height: `${bottom - top}px`, marginTop: head.top, marginBottom: tail.bottom, breakInside: 'avoid', breakBefore: head.before, breakAfter: tail.after }));
      run = [];
    };
    for (const node of Array.from(elements[index].childNodes)) {
      // Only whitespace text is left in containers that aren't copied whole (see measureForSheets).
      const child = node instanceof Element ? indexOf.get(node) : undefined;
      if (child === undefined) continue;
      const onPage = first[child] <= page && page <= last[child];
      if (onPage) {
        flush();
        out.appendChild(mode[child] === 'leaf' ? whole(child) : build(child));
      } else if (outOfFlow[child]) {
        continue;
      } else if (first[child] > last[child]) {
        // Renders nothing.
        flush();
        out.appendChild(node.cloneNode(false));
      } else if (mode[index] === 'grid') {
        flush();
        out.appendChild(sized(child));
      } else if (first[child] > page) {
        flush();
        out.appendChild(standIn({ height: `${columnHeightPx}px` }));
        break;
      } else if (first[child] === last[child] && boxes[child].length === 1) {
        if (run.length && first[run[0]] !== first[child]) flush();
        run.push(child);
      } else {
        // Split across earlier pages: cut down inside it.
        flush();
        out.appendChild(mode[child] === 'leaf' ? whole(child) : build(child));
      }
    }
    flush();
    return out;
  };
  return { root: build(0) as HTMLElement, kept };
};

/** Whether every kept element has exactly the boxes on `page` that it has in the full copy. */
const matchesFullCopy = (measured: ReturnType<typeof measureForSheets>, page: number, column: HTMLElement, kept: [number, Element][]) => {
  const origin = column.getBoundingClientRect();
  const close = (a: PageBox, b: PageBox) =>
    Math.abs(a.left - b.left) <= SHEET_TOLERANCE_PX &&
    Math.abs(a.top - b.top) <= SHEET_TOLERANCE_PX &&
    Math.abs(a.width - b.width) <= SHEET_TOLERANCE_PX &&
    Math.abs(a.height - b.height) <= SHEET_TOLERANCE_PX;
  return kept.every(([index, clone]) => {
    const want = measured.boxes[index].filter((box) => box.column === page);
    const got = measured.boxesOf(clone, origin).filter((box) => box.column === page);
    return want.length === got.length && want.every((box, k) => close(box, got[k]));
  });
};

/**
 * Each page's cut-down copy (see pruneToPage) in a host styled like the full one, detached; null for pages
 * whose cut-down layout differs at all from the full copy (and for every page in Safari, which reports one box
 * for a block split across columns, so what is on which page can't be told).
 */
const prunedPages = (paged: PaginatedCopy, pages: number): (HTMLElement | null)[] => {
  const columns: (HTMLElement | null)[] = Array(pages).fill(null);
  if (pages < 2 || !SUPPORTS_CLONE) return columns;
  const measured = measureForSheets(paged);
  const pruned = Array.from({ length: pages }, (_, page) => {
    const { root, kept } = pruneToPage(measured, page, paged.columnHeightPx);
    const probe = paged.host.cloneNode(false) as HTMLElement;
    probe.appendChild(root);
    return { probe, kept };
  });
  try {
    pruned.forEach(({ probe }) => document.body.appendChild(probe));
    pruned.forEach(({ probe, kept }, page) => {
      if (matchesFullCopy(measured, page, probe, kept)) columns[page] = probe;
    });
  } finally {
    pruned.forEach(({ probe }) => probe.remove());
  }
  return columns;
};

/**
 * The paper as separate printed pages for the on-screen page view: one sheet per page, each showing
 * its page-sized column of a paginated copy inside the page's margins (15mm, or none for full-bleed
 * templates), so the preview breaks, repeats frames and fills the last page exactly as the PDF does.
 * Each sheet holds only what shows on its page where that lays out the same (see prunedPages), so a long CV
 * costs about one copy in all rather than one per page.
 */
export const buildPageSheets = (paper: HTMLElement, fullBleed: boolean): HTMLElement[] => {
  const paged = createPaginatedCopy(paper, fullBleed, undefined, true);
  try {
    const { host, copy, columnWidthPx, columnHeightPx } = paged;
    const naturalPx = naturalHeight(copy);
    applyColumns(paged);
    const pages = fitsOnePage(naturalPx, columnHeightPx) ? 1 : countPages(paged);
    if (fullBleed && pages > 1 && !SUPPORTS_CLONE) tallestWithPages(paged, pages);
    else if (fullBleed) copy.style.minHeight = `${pages === 1 ? columnHeightPx - 1 : heightToFillLastPage(paged, naturalPx, pages)}px`;
    const pruned = prunedPages(paged, pages);
    host.remove();
    return pruned.map((column, index) => {
      const sheetColumn = column ?? (host.cloneNode(true) as HTMLElement);
      Object.assign(sheetColumn.style, { position: 'absolute', left: `${-index * (columnWidthPx + GAP_PX)}px`, top: '0', opacity: '', visibility: '' });
      sheetColumn.removeAttribute('aria-hidden');
      return sheetFor(paper, fullBleed, sheetColumn, columnWidthPx, columnHeightPx);
    });
  } finally {
    paged.host.remove();
  }
};

/** A sheet of paper showing `column` (one page of the paginated copy) inside the page's margins. */
const sheetFor = (paper: HTMLElement, fullBleed: boolean, column: HTMLElement, columnWidthPx: number, columnHeightPx: number) => {
  const inset = pageBoxMm(fullBleed, paper.dataset.paper).inset * MM_TO_PX;
  const { widthMm, heightMm } = paperOf(paper);
  const sheet = document.createElement('div');
  sheet.className = 'resume-page-sheet';
  Object.assign(sheet.style, { position: 'relative', width: `${widthMm * MM_TO_PX}px`, height: `${heightMm * MM_TO_PX}px`, overflow: 'hidden', background: '#ffffff' });
  const frame = document.createElement('div');
  Object.assign(frame.style, { position: 'absolute', left: `${inset}px`, top: `${inset}px`, width: `${columnWidthPx}px`, height: `${columnHeightPx}px`, overflow: 'hidden' });
  frame.appendChild(column);
  sheet.appendChild(frame);
  return sheet;
};
