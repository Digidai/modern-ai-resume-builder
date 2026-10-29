import React, { useLayoutEffect, useRef, useState } from 'react';
import { ResumeData } from '../types';
import { ResumeTemplateRenderer } from './ResumeTemplateRenderer';
import { isFullBleedTemplate } from '../constants/templates';
import { PAGE_HEIGHT_PX, PRINT_CONFIG } from '../constants/print';
import { measurePrintLayout, type PrintLayout } from '../utils/printLayout';

const ONE_PAGE: PrintLayout = { pages: 1, breaksMm: [] };
import { designStyle } from '../constants/design';
import { getCspNonce } from '../utils/csp';

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
      setLayout((prev) => (prev.pages === next.pages && prev.breaksMm.join() === next.breaksMm.join() ? prev : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(paper);
    return () => observer.disconnect();
  }, [data, isFullBleed, paginated]);

  const breaks = layout.breaksMm;
  const { MARGIN_STANDARD_MM: std, MARGIN_CONTINUATION_MM: cont } = PRINT_CONFIG;

  // Standard templates get 15mm @page margins on every page. Full-bleed templates own page 1's margins;
  // once they run past one page, page 1 gets a bottom margin and later pages a top and bottom margin, so no
  // text is printed against the paper edge.
  const printStyles = !isFullBleed
    ? `@page { size: A4; margin: ${std}mm; }
       @media print { .resume-preview-container { padding: 0 !important; min-height: 0 !important; } }`
    : layout.pages > 1
      ? `@page { size: A4; margin: ${cont}mm 0; } @page :first { margin: 0 0 ${cont}mm; }
         @media print { .resume-preview-container { min-height: 0 !important; } }`
      : `@page { size: A4; margin: 0; }
         @media print { .resume-preview-container { min-height: calc(297mm - 1px) !important; } }`;

  return (
    <div
      ref={paperRef}
      className={`resume-paper resume-preview-container relative box-border flex min-h-[297mm] w-full flex-col overflow-hidden bg-white text-slate-900 print:overflow-visible ${
        isFullBleed ? '' : 'p-[15mm]'
      }`}
      id={id || undefined}
      data-template-id={data.templateId}
      data-pages={layout.pages}
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
