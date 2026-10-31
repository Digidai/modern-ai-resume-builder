import React, { useLayoutEffect, useRef, useState } from 'react';
import { ResumeData } from '../types';
import { ResumeTemplateRenderer } from './ResumeTemplateRenderer';
import { isFullBleedTemplate } from '../constants/templates';
import { MM_TO_PX, PRINT_CONFIG, paperSize } from '../constants/print';
import { measurePrintLayout, SUPPORTS_CLONE, type PrintLayout } from '../utils/printLayout';
import { designStyle } from '../constants/design';
import { getCspNonce } from '../utils/csp';

const onePage = (pageHeightPx: number): PrintLayout => ({ pages: 1, breaksMm: [], fillHeightPx: pageHeightPx - 1, lastPageFill: 1 });

interface ResumePreviewProps {
  data: ResumeData;
  /** DOM id used by PDF export; only the one preview that gets exported should keep the default. */
  id?: string;
  /** Dashed page-break guides (screen only). Off for thumbnails. */
  showPageBreaks?: boolean;
}

/**
 * The "paper", A4 or US Letter (`design.paper`). Templates render inside a flex column that fills at
 * least one page; a template's root should be `flex-1` (never a fixed page height) so backgrounds reach the
 * bottom at any scale. Design settings arrive as CSS custom properties plus a uniform zoom.
 */
const ResumePreview: React.FC<ResumePreviewProps> = ({ data, id = 'resume-preview-container', showPageBreaks = true }) => {
  const isFullBleed = isFullBleedTemplate(data.templateId);
  const scale = data.design?.scale || 1;
  const page = paperSize(data.design?.paper);
  const pageHeightPx = page.heightMm * MM_TO_PX;
  const paperRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<PrintLayout>(() => onePage(pageHeightPx));
  // Thumbnails are never printed or paginated, so only the editor, export and render papers measure.
  const paginated = showPageBreaks || !!id;

  useLayoutEffect(() => {
    const paper = paperRef.current;
    if (!paper || !paginated) return;
    const measure = () => {
      // Up to one page tall (the paper's min-height) always prints on one page; only longer papers need
      // the full print simulation. Exact layout height (offsetHeight rounds, and the paper may be visually
      // scaled): Chromium prints a second page for an overflow under a pixel, so allow only rounding of the
      // computed value (2 decimals).
      const next = parseFloat(getComputedStyle(paper).height) <= pageHeightPx + 0.01 ? onePage(pageHeightPx) : measurePrintLayout(paper, isFullBleed);
      setLayout((prev) =>
        prev.pages === next.pages && prev.breaksMm.join() === next.breaksMm.join() && prev.fillHeightPx === next.fillHeightPx && prev.lastPageFill === next.lastPageFill
          ? prev
          : next
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(paper);
    return () => observer.disconnect();
  }, [data, isFullBleed, paginated, pageHeightPx]);

  const breaks = layout.breaksMm;
  const std = PRINT_CONFIG.MARGIN_STANDARD_MM;

  // Standard templates get 15mm @page margins on every page. Full-bleed templates print edge to edge: their
  // root (and any `.page-frame`) repeats its padding and background on every page, and the paper fills whole
  // pages so the background also reaches the bottom of the last one. Safari doesn't repeat frames, so its own
  // print skips the stretch (server PDFs measure the stretch in the engine that prints).
  const fillRule = !SUPPORTS_CLONE && layout.pages > 1 ? 'min-height: 0' : `min-height: ${layout.fillHeightPx}px`;
  const printStyles = !isFullBleed
    ? `@page { size: ${page.css}; margin: ${std}mm; }
       @media print { .resume-preview-container { padding: 0 !important; min-height: 0 !important; } }`
    : `@page { size: ${page.css}; margin: 0; }
       @media print { .resume-preview-container { ${fillRule} !important; } }`;

  return (
    <div
      ref={paperRef}
      className={`resume-paper resume-preview-container relative box-border flex w-full flex-col overflow-hidden bg-white text-slate-900 print:overflow-visible ${
        isFullBleed ? '' : 'p-[15mm]'
      }`}
      id={id || undefined}
      data-template-id={data.templateId}
      data-paper={page.id}
      data-full-bleed={isFullBleed || undefined}
      data-pages={layout.pages}
      data-last-page-fill={layout.lastPageFill.toFixed(2)}
      style={{ ...(data.design ? designStyle(data.design) : undefined), minHeight: `${page.heightMm}mm` }}
    >
      <style nonce={getCspNonce()}>{printStyles}</style>

      {showPageBreaks &&
        breaks.map((mm, index) => (
          <div
            key={mm}
            style={{ top: `${mm}mm` }}
            className="pointer-events-none absolute inset-x-0 z-50 border-t border-dashed border-slate-400/70 print:hidden"
            data-export-ignore="true"
          >
            <div className="absolute right-2 top-1 rounded bg-white/90 px-1.5 font-sans text-[10px] font-medium text-slate-500">
              Page {index + 2}
            </div>
          </div>
        ))}

      {/* `zoom` (not transform) so the scaled layout reflows, paginates, and prints correctly. */}
      <div className="flex flex-1 flex-col" data-resume-zoom style={scale !== 1 ? { zoom: scale } : undefined}>
        <ResumeTemplateRenderer data={data} templateId={data.templateId} />
      </div>
    </div>
  );
};

export default ResumePreview;
