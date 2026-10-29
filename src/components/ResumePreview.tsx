import React, { useLayoutEffect, useRef, useState } from 'react';
import { ResumeData } from '../types';
import { ResumeTemplateRenderer } from './ResumeTemplateRenderer';
import { isFullBleedTemplate } from '../constants/templates';
import { PAGE_HEIGHT_PX, PRINT_CONFIG } from '../constants/print';
import { measurePrintLayout, type PrintLayout } from '../utils/printLayout';
import { designStyle } from '../constants/design';
import { getCspNonce } from '../utils/csp';

/**
 * Whether this browser repeats a block's padding and background on each page (Chromium, Firefox). The
 * last-page fill height is only meaningful where it does; Safari measures without it, so its own print
 * skips the stretch. Server PDFs ignore this rule and measure the stretch in the engine that prints.
 */
const SUPPORTS_CLONE = typeof CSS !== 'undefined' && CSS.supports('box-decoration-break', 'clone');

const ONE_PAGE: PrintLayout = { pages: 1, breaksMm: [], fillHeightPx: PAGE_HEIGHT_PX - 1, lastPageFill: 1 };

interface ResumePreviewProps {
  data: ResumeData;
  /** DOM id used by PDF export; only the one preview that gets exported should keep the default. */
  id?: string;
  /** Dashed A4 page-break guides (screen only). Off for thumbnails. */
  showPageBreaks?: boolean;
}

/**
 * The A4 "paper". Templates render inside a flex column that fills at least one page;
 * a template's root should be `flex-1` (never a fixed 297mm height) so backgrounds reach the
 * bottom at any scale. Design settings arrive as CSS custom properties plus a uniform zoom.
 */
const ResumePreview: React.FC<ResumePreviewProps> = ({ data, id = 'resume-preview-container', showPageBreaks = true }) => {
  const isFullBleed = isFullBleedTemplate(data.templateId);
  const scale = data.design?.scale || 1;
  const paperRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<PrintLayout>(ONE_PAGE);
  // Thumbnails are never printed or paginated, so only the editor, export and render papers measure.
  const paginated = showPageBreaks || !!id;

  useLayoutEffect(() => {
    const paper = paperRef.current;
    if (!paper || !paginated) return;
    const measure = () => {
      // Up to one A4 tall (the paper's min-height) always prints on one page; only longer papers need
      // the full print simulation.
      const next = paper.offsetHeight <= PAGE_HEIGHT_PX + 1 ? ONE_PAGE : measurePrintLayout(paper, isFullBleed);
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
  }, [data, isFullBleed, paginated]);

  const breaks = layout.breaksMm;
  const std = PRINT_CONFIG.MARGIN_STANDARD_MM;

  // Standard templates get 15mm @page margins on every page. Full-bleed templates print edge to edge: their
  // root (and any `.page-frame`) repeats its padding and background on every page, and the paper fills whole
  // pages so the background also reaches the bottom of the last one.
  const fillRule = !SUPPORTS_CLONE && layout.pages > 1 ? 'min-height: 0' : `min-height: ${layout.fillHeightPx}px`;
  const printStyles = !isFullBleed
    ? `@page { size: A4; margin: ${std}mm; }
       @media print { .resume-preview-container { padding: 0 !important; min-height: 0 !important; } }`
    : `@page { size: A4; margin: 0; }
       @media print { .resume-preview-container { ${fillRule} !important; } }`;

  return (
    <div
      ref={paperRef}
      className={`resume-paper resume-preview-container relative box-border flex min-h-[297mm] w-full flex-col overflow-hidden bg-white text-slate-900 print:overflow-visible ${
        isFullBleed ? '' : 'p-[15mm]'
      }`}
      id={id || undefined}
      data-template-id={data.templateId}
      data-full-bleed={isFullBleed || undefined}
      data-pages={layout.pages}
      data-last-page-fill={layout.lastPageFill.toFixed(2)}
      style={data.design ? designStyle(data.design) : undefined}
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
