import React from 'react';
import { ResumeData } from '../types';
import { ResumeTemplateRenderer } from './ResumeTemplateRenderer';
import { isFullBleedTemplate } from '../constants/templates';
import { PRINT_CONFIG } from '../constants/print';

interface ResumePreviewProps {
  data: ResumeData;
  showFullPage?: boolean;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ data, showFullPage = true }) => {
  const wrapperClass = "resume-preview-container box-border bg-white text-slate-900 w-full h-full shadow-xl print:shadow-none p-12 md:p-16 print:p-[1.5cm] overflow-hidden print:overflow-visible relative flex flex-col";

  const isFullBleed = isFullBleedTemplate(data.templateId);
  const shouldUseA4Height = showFullPage || isFullBleed;
  const pageHeightClass = shouldUseA4Height ? `min-h-[${PRINT_CONFIG.PAGE_HEIGHT_MM}cm]` : '';
  const containerClass = isFullBleed
    ? `resume-preview-container box-border bg-white text-slate-900 w-full h-full ${pageHeightClass} shadow-xl print:shadow-none overflow-hidden print:overflow-visible flex flex-col`
    : `${wrapperClass} ${pageHeightClass}`;

  // Dynamic Print Styles
  // For standard templates, we use @page margins to ensure every page has specific white space.
  // For full-bleed templates, we set 0 margin so colors can touch the edge.
  const printStyles = `
    @page {
      size: A4;
      margin: ${isFullBleed ? `${PRINT_CONFIG.MARGIN_FULL_BLEED_MM}mm` : `${PRINT_CONFIG.MARGIN_STANDARD_MM}mm`};
    }
    @media print {
      .resume-preview-container {
        padding: 0 !important; /* Let @page handle margins */
      }
    }
  `;

  const renderTemplate = () => {
    return <ResumeTemplateRenderer data={data} templateId={data.templateId} />;
  };

  return (
    <div className={containerClass} id="resume-preview-container" data-template-id={data.templateId}>
      <style>{printStyles}</style>

      {/* Visual Page Break Marker (screen only) */}
      {/* Visual Page Break Marker (screen only) */}
      <div
        className="absolute inset-0 pointer-events-none z-50 print:hidden"
        data-export-ignore="true"
        style={{
          // Creates a subtle dashed line effect at A4 intervals
          backgroundImage: `
            linear-gradient(to right, #94a3b8 50%, transparent 50%),
            linear-gradient(to right, #94a3b8 50%, transparent 50%)
          `,
          backgroundSize: '12px 1px',
          backgroundPosition: `0 ${PRINT_CONFIG.PAGE_HEIGHT_MM}mm`, // Start at first page break
          backgroundRepeat: 'repeat-x',
          // Use a second gradient to repeat this line vertically
          maskImage: `linear-gradient(to bottom, transparent ${PRINT_CONFIG.PAGE_HEIGHT_MM - 0.2}mm, black ${PRINT_CONFIG.PAGE_HEIGHT_MM - 0.2}mm, black ${PRINT_CONFIG.PAGE_HEIGHT_MM + 0.2}mm, transparent ${PRINT_CONFIG.PAGE_HEIGHT_MM + 0.2}mm)`,
          maskSize: `100% ${PRINT_CONFIG.PAGE_HEIGHT_MM}mm`,
          WebkitMaskImage: `linear-gradient(to bottom, transparent ${PRINT_CONFIG.PAGE_HEIGHT_MM - 0.2}mm, black ${PRINT_CONFIG.PAGE_HEIGHT_MM - 0.2}mm, black ${PRINT_CONFIG.PAGE_HEIGHT_MM + 0.2}mm, transparent ${PRINT_CONFIG.PAGE_HEIGHT_MM + 0.2}mm)`,
          WebkitMaskSize: `100% ${PRINT_CONFIG.PAGE_HEIGHT_MM}mm`,
          opacity: 0.4
        }}
      />
      {/* Page Number Indicators (Approximate for first few pages) */}
      {[...PRINT_CONFIG.PAGE_BREAK_POSITIONS].map((position, index) => (
        <div key={position} className={`absolute top-[${position}] right-0 w-full border-t border-transparent z-50 print:hidden pointer-events-none`} data-export-ignore="true">
          <div className="absolute right-2 -top-3 text-[10px] text-slate-400 font-sans bg-white/80 px-1 rounded">Page {index + 2} Start</div>
        </div>
      ))}

      {renderTemplate()}
    </div>
  );
};
export default ResumePreview;
