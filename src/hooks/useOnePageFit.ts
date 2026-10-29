import { useCallback, useEffect, useState } from 'react';
import type { ResumeDesign } from '../types';
import { SCALE_MIN } from '../constants/design';
import { isFullBleedTemplate } from '../constants/templates';
import { largestOnePageScale, measurePrintLayout } from '../utils/printLayout';

const PREVIEW_ID = 'resume-preview-container';

/** Printed page count of the exported preview, or null while it has no layout (e.g. hidden on mobile). */
export const usePreviewPages = () => {
  const [pages, setPages] = useState<number | null>(null);
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
      // ResumePreview keeps `data-pages` current.
      const measure = () => setPages(el.offsetHeight ? Number(el.dataset.pages) || 1 : null);
      resize = new ResizeObserver(measure);
      resize.observe(el);
      mutation = new MutationObserver(measure);
      mutation.observe(el, { attributes: true, attributeFilter: ['data-pages'] });
      measure();
    };
    attach();
    return () => {
      cancelAnimationFrame(frame);
      resize?.disconnect();
      mutation?.disconnect();
    };
  }, []);
  return pages;
};

/**
 * Page count plus "Fit to one page": picks the largest text size (down to the minimum) that prints on
 * one page, measured off-screen, then applies it in one step. If nothing fits, the size is left alone
 * and `note` says why.
 */
export const useOnePageFit = (design: ResumeDesign, onChange: (patch: Partial<ResumeDesign>) => void) => {
  const pageCount = usePreviewPages();
  const [note, setNote] = useState('');

  useEffect(() => {
    if (pageCount === 1) setNote('');
  }, [pageCount]);

  const fit = useCallback(() => {
    const paper = document.getElementById(PREVIEW_ID);
    if (!paper) return;
    const fullBleed = isFullBleedTemplate(paper.dataset.templateId ?? '');
    const scale = largestOnePageScale(paper, fullBleed, design.scale, SCALE_MIN);
    if (scale !== null) {
      setNote('');
      onChange({ scale });
      return;
    }
    const pages = measurePrintLayout(paper, fullBleed, SCALE_MIN).pages;
    setNote(
      `Still ${pages} pages at the smallest text size (${Math.round(SCALE_MIN * 100)}%), so nothing was changed. Shorten a few bullets or try the Compact template.`
    );
  }, [design.scale, onChange]);

  return { pageCount, fit, note, atMinimum: design.scale <= SCALE_MIN + 1e-6 };
};
