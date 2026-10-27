import React from 'react';
import { ResumeData } from '../types';
import { ResumeTemplateRenderer } from './ResumeTemplateRenderer';
import { isFullBleedTemplate } from '../constants/templates';
import { PRINT_CONFIG } from '../constants/print';
import { designStyle } from '../constants/design';
import { getCspNonce } from '../utils/csp';

interface ResumePreviewProps {
  data: ResumeData;
  /** DOM id used by PDF export; only the one preview that gets exported should keep the default. */
  id?: string;
  /** Dashed A4 page-break guides (screen only). Off for thumbnails. */
  showPageBreaks?: boolean;
}

const PAGE_BREAK_GUIDE_STYLE: React.CSSProperties = {
  backgroundImage: 'linear-gradient(to right, #94a3b8 50%, transparent 50%)',
  backgroundSize: '12px 1px',
  backgroundPosition: `0 ${PRINT_CONFIG.PAGE_HEIGHT_MM}mm`,
  backgroundRepeat: 'repeat-x',
  maskImage: `linear-gradient(to bottom, transparent ${PRINT_CONFIG.PAGE_HEIGHT_MM - 0.2}mm, black ${PRINT_CONFIG.PAGE_HEIGHT_MM - 0.2}mm, black ${PRINT_CONFIG.PAGE_HEIGHT_MM + 0.2}mm, transparent ${PRINT_CONFIG.PAGE_HEIGHT_MM + 0.2}mm)`,
  maskSize: `100% ${PRINT_CONFIG.PAGE_HEIGHT_MM}mm`,
  WebkitMaskImage: `linear-gradient(to bottom, transparent ${PRINT_CONFIG.PAGE_HEIGHT_MM - 0.2}mm, black ${PRINT_CONFIG.PAGE_HEIGHT_MM - 0.2}mm, black ${PRINT_CONFIG.PAGE_HEIGHT_MM + 0.2}mm, transparent ${PRINT_CONFIG.PAGE_HEIGHT_MM + 0.2}mm)`,
  WebkitMaskSize: `100% ${PRINT_CONFIG.PAGE_HEIGHT_MM}mm`,
  opacity: 0.4,
};

/**
 * The A4 "paper". Templates render inside a flex column that fills at least one page;
 * a template's root should be `flex-1` (never a fixed 297mm height) so backgrounds reach the
 * bottom at any scale. Design settings arrive as CSS custom properties plus a uniform zoom.
 */
const ResumePreview: React.FC<ResumePreviewProps> = ({ data, id = 'resume-preview-container', showPageBreaks = true }) => {
  const isFullBleed = isFullBleedTemplate(data.templateId);
  const scale = data.design?.scale || 1;

  // Standard templates get page margins from @page when printed; full-bleed templates own theirs.
  const printStyles = `
    @page { size: A4; margin: ${isFullBleed ? PRINT_CONFIG.MARGIN_FULL_BLEED_MM : PRINT_CONFIG.MARGIN_STANDARD_MM}mm; }
    @media print {
      .resume-preview-container { padding: 0 !important; min-height: ${isFullBleed ? 'calc(297mm - 1px)' : '0'} !important; }
    }
  `;

  return (
    <div
      className={`resume-paper resume-preview-container relative box-border flex min-h-[297mm] w-full flex-col overflow-hidden bg-white text-slate-900 print:overflow-visible ${
        isFullBleed ? '' : 'p-[15mm]'
      }`}
      id={id || undefined}
      data-template-id={data.templateId}
      style={data.design ? designStyle(data.design) : undefined}
    >
      <style nonce={getCspNonce()}>{printStyles}</style>

      {showPageBreaks && (
        <div className="pointer-events-none absolute inset-0 z-50 print:hidden" data-export-ignore="true" style={PAGE_BREAK_GUIDE_STYLE} />
      )}
      {showPageBreaks &&
        PRINT_CONFIG.PAGE_BREAK_POSITIONS.map((position, index) => (
          <div
            key={position}
            style={{ top: position }}
            className="pointer-events-none absolute right-0 z-50 w-full print:hidden"
            data-export-ignore="true"
          >
            <div className="absolute right-2 top-1 rounded bg-white/80 px-1 font-sans text-[10px] text-slate-400">Page {index + 2}</div>
          </div>
        ))}

      {/* `zoom` (not transform) so the scaled layout reflows, paginates, and prints correctly. */}
      <div className="flex flex-1 flex-col" style={scale !== 1 ? { zoom: scale } : undefined}>
        <ResumeTemplateRenderer data={data} templateId={data.templateId} />
      </div>
    </div>
  );
};

export default ResumePreview;
