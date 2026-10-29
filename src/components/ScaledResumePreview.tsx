import React, { useLayoutEffect, useRef, useState } from 'react';
import { ResumeData } from '../types';
import ResumePreview from './ResumePreview';
import { isFullBleedTemplate } from '../constants/templates';
import { buildPageSheets } from '../utils/printLayout';

/** Space between sheets in the page view, in unscaled px. */
const SHEET_GAP_PX = 28;

/** A4 width at 96 dpi; the paper is always laid out at this width and then scaled. */
const A4_WIDTH_PX = (210 / 25.4) * 96;
const A4_HEIGHT_PX = (297 / 25.4) * 96;

interface ScaledResumePreviewProps {
  data: ResumeData;
  /** Overrides data.templateId (used by template pickers). */
  templateId?: string;
  /**
   * `page`: full document at natural height (main preview; exported to PDF when `exportable`).
   * `thumbnail`: first page only, clipped to the A4 aspect ratio, not interactive.
   */
  mode?: 'page' | 'thumbnail';
  /** Marks this preview as the one PDF export captures (DOM id `resume-preview-container`). */
  exportable?: boolean;
  /** Upper bound for the scale factor in page mode (1 = true size). */
  maxScale?: number;
  className?: string;
  /** Called with the document height in A4 pages (e.g. 1.3) whenever it changes. */
  onPages?: (pages: number) => void;
  /**
   * Page mode only. `pages`: separate A4 sheets laid out exactly as printed (breaks, margins and
   * repeated backgrounds). `continuous`: one long sheet with dashed lines where pages start.
   */
  view?: 'pages' | 'continuous';
}

/**
 * The page view: rebuilds the printed sheets from the (invisible, still laid out) paper whenever it
 * changes. The paper stays the exported, measured and accessible element; the sheets are copies.
 */
const PageSheets: React.FC<{ paperHost: React.RefObject<HTMLDivElement | null>; fullBleed: boolean }> = ({ paperHost, fullBleed }) => {
  const sheetsRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const paper = paperHost.current?.querySelector<HTMLElement>('.resume-paper');
    const sheets = sheetsRef.current;
    if (!paper || !sheets) return;
    const rebuild = () => sheets.replaceChildren(...buildPageSheets(paper, fullBleed));
    rebuild();
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(rebuild);
    };
    const mutation = new MutationObserver(schedule);
    mutation.observe(paper, { subtree: true, childList: true, characterData: true, attributes: true });
    const resize = new ResizeObserver(schedule);
    resize.observe(paper);
    document.fonts?.addEventListener('loadingdone', schedule);
    return () => {
      cancelAnimationFrame(frame);
      mutation.disconnect();
      resize.disconnect();
      document.fonts?.removeEventListener('loadingdone', schedule);
    };
  }, [paperHost, fullBleed]);
  return (
    <div
      ref={sheetsRef}
      className="flex flex-col [&>.resume-page-sheet]:shadow-sheet print:hidden"
      style={{ gap: SHEET_GAP_PX }}
      aria-hidden="true"
      inert
      data-testid="page-sheets"
    />
  );
};

/**
 * Renders the resume at true A4 width and scales it to fit its container, so the layout is
 * identical on phones, in thumbnails, and in the exported PDF.
 */
export const ScaledResumePreview: React.FC<ScaledResumePreviewProps> = ({
  data,
  templateId,
  mode = 'thumbnail',
  exportable = false,
  maxScale = 1,
  className = '',
  onPages,
  view = 'continuous',
}) => {
  const paperHostRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [outerWidth, setOuterWidth] = useState(0);
  const [contentHeight, setContentHeight] = useState(A4_HEIGHT_PX);
  const onPagesRef = useRef(onPages);
  onPagesRef.current = onPages;

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const update = () => {
      const width = outer.clientWidth;
      setOuterWidth(width);
      if (width > 0) setScale(Math.min(mode === 'page' ? maxScale : Infinity, width / A4_WIDTH_PX));
      setContentHeight(inner.offsetHeight || A4_HEIGHT_PX);
      if (inner.offsetHeight) onPagesRef.current?.(inner.offsetHeight / A4_HEIGHT_PX);
    };
    update();

    const observer = new ResizeObserver(update);
    observer.observe(outer);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [mode, maxScale]);

  const resolvedData = templateId ? { ...data, templateId } : data;
  const isThumbnail = mode === 'thumbnail';
  const paged = !isThumbnail && view === 'pages';
  const height = isThumbnail ? A4_HEIGHT_PX * scale : contentHeight * scale;

  return (
    <div
      ref={outerRef}
      className={`relative w-full ${isThumbnail ? 'overflow-hidden select-none pointer-events-none' : ''} ${className}`}
      style={{ height: scale ? height : undefined, aspectRatio: scale ? undefined : '210 / 297' }}
      aria-hidden={isThumbnail || undefined}
      inert={isThumbnail || undefined}
    >
      <div
        ref={innerRef}
        className="absolute top-0 origin-top-left"
        style={{
          width: A4_WIDTH_PX,
          transform: `scale(${scale || 0.0001})`,
          // Centered when capped by maxScale and narrower than the container.
          left: Math.max(0, (outerWidth - A4_WIDTH_PX * scale) / 2),
          visibility: scale ? 'visible' : 'hidden',
        }}
      >
        {/* In the page view the paper stays laid out (for export, measuring and screen readers) but invisible. */}
        <div ref={paperHostRef} className={paged ? 'pointer-events-none absolute inset-x-0 top-0 opacity-0 print:static print:opacity-100' : undefined}>
          <ResumePreview data={resolvedData} id={exportable ? 'resume-preview-container' : ''} showPageBreaks={!isThumbnail && !paged} />
        </div>
        {paged && <PageSheets paperHost={paperHostRef} fullBleed={isFullBleedTemplate(resolvedData.templateId)} />}
      </div>
    </div>
  );
};
