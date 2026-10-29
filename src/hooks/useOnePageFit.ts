import { useCallback, useEffect, useState } from 'react';
import type { ResumeDesign } from '../types';
import { SCALE_MIN } from '../constants/design';
import { isFullBleedTemplate } from '../constants/templates';
import { largestScaleForPages, measurePrintLayout } from '../utils/printLayout';

const PREVIEW_ID = 'resume-preview-container';
/** Below this share of a page, the last page reads as "only a few lines" (about ten lines of body text). */
const SPARSE_LAST_PAGE = 0.2;

interface PreviewPages {
  pages: number;
  lastPageFill: number;
}

/** Printed pages of the exported preview (kept current by ResumePreview), or null while it has no layout (e.g. hidden on mobile). */
export const usePreviewPages = () => {
  const [state, setState] = useState<PreviewPages | null>(null);
  useEffect(() => {
    let resize: ResizeObserver | undefined;
    let mutation: MutationObserver | undefined;
    let frame = 0;
    const attach = () => {
      const el = document.getElementById(PREVIEW_ID);
      if (!el) {
        frame = requestAnimationFrame(attach);
        return;
      }
      const measure = () => {
        const next = el.offsetHeight ? { pages: Number(el.dataset.pages) || 1, lastPageFill: Number(el.dataset.lastPageFill ?? 1) } : null;
        setState((prev) => (prev?.pages === next?.pages && prev?.lastPageFill === next?.lastPageFill ? prev : next));
      };
      resize = new ResizeObserver(measure);
      resize.observe(el);
      mutation = new MutationObserver(measure);
      mutation.observe(el, { attributes: true, attributeFilter: ['data-pages', 'data-last-page-fill'] });
      measure();
    };
    attach();
    return () => {
      cancelAnimationFrame(frame);
      resize?.disconnect();
      mutation?.disconnect();
    };
  }, []);
  return state;
};

const pagesLabel = (pages: number) => (pages === 1 ? 'one page' : `${pages} pages`);

/**
 * Page count plus "Fit to N−1 pages" (one page for a two-page resume): picks the largest text size, down
 * to the minimum, that drops the last page, measured off-screen, and applies it in one step. If nothing
 * fits, the size is left alone and `note` says why.
 */
export const useOnePageFit = (design: ResumeDesign, onChange: (patch: Partial<ResumeDesign>) => void) => {
  const preview = usePreviewPages();
  const pageCount = preview?.pages ?? null;
  const target = pageCount && pageCount > 1 ? pageCount - 1 : 1;
  const [note, setNote] = useState('');

  useEffect(() => setNote(''), [pageCount]);

  const fit = useCallback(() => {
    const paper = document.getElementById(PREVIEW_ID);
    if (!paper) return;
    const fullBleed = isFullBleedTemplate(paper.dataset.templateId ?? '');
    const scale = largestScaleForPages(paper, fullBleed, design.scale, SCALE_MIN, target);
    if (scale !== null) {
      setNote('');
      onChange({ scale });
      return;
    }
    const pages = measurePrintLayout(paper, fullBleed, SCALE_MIN).pages;
    setNote(
      `Still ${pagesLabel(pages)} at the smallest text size (${Math.round(SCALE_MIN * 100)}%), so nothing was changed. Shorten a few bullets or try the Compact template.`
    );
  }, [design.scale, onChange, target]);

  return {
    pageCount,
    /** The last page holds only a few lines, so dropping it is usually a small change. */
    lastPageSparse: !!preview && preview.pages > 1 && preview.lastPageFill < SPARSE_LAST_PAGE,
    fitLabel: `Fit to ${pagesLabel(target)}`,
    fit,
    note,
    atMinimum: design.scale <= SCALE_MIN + 1e-6,
  };
};
