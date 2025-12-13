import React from 'react';
import { ResumeData } from '../types';
import { ModernTemplate, MinimalistTemplate, SidebarTemplate, ExecutiveTemplate, CreativeTemplate, CompactTemplate, TechTemplate, ProfessionalTemplate, AcademicTemplate, ElegantTemplate, SwissTemplate, OpalTemplate, WireframeTemplate, BerlinTemplate, LateralTemplate, IronTemplate, GintoTemplate, SymmetryTemplate, BronxTemplate, PathTemplate, QuartzTemplate, SilkTemplate, MonoTemplate, PopTemplate, NoirTemplate, PaperTemplate, CastTemplate, ModaTemplate } from './ResumeTemplates';

interface ResumePreviewProps {
  data: ResumeData;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ data }) => {
  // Common wrapper styling for the paper effect
  // print:p-[2cm] ensures standard margins for non-sidebar templates when @page margin is 0
  const wrapperClass = "resume-preview-container bg-white text-slate-900 w-full h-full min-h-[29.7cm] shadow-xl print:shadow-none p-12 md:p-16 print:p-[1.5cm] overflow-hidden print:overflow-visible relative flex flex-col";

  // Templates that handle their own full-bleed layout or have specific padding requirements
  // These templates should NOT have the default container padding applied
  const fullBleedTemplates = [
    'sidebar', 'creative', 'professional', 'opal', 'wireframe', 'berlin',
    'lateral', 'iron', 'ginto', 'symmetry', 'bronx', 'path', 'quartz', 'silk',
    'mono', 'pop', 'noir', 'paper', 'cast', 'moda'
  ];

  const isFullBleed = fullBleedTemplates.includes(data.templateId);
  const containerClass = isFullBleed
    ? "resume-preview-container bg-white text-slate-900 w-full h-full min-h-[29.7cm] shadow-xl print:shadow-none overflow-hidden print:overflow-visible flex flex-col"
    : wrapperClass;

  // Dynamic Print Styles
  // For standard templates, we use @page margins to ensure every page has specific white space.
  // For full-bleed templates, we set 0 margin so colors can touch the edge.
  const printStyles = `
    @page {
      size: A4;
      margin: ${isFullBleed ? '0mm' : '15mm'};
    }
    @media print {
      .resume-preview-container {
        padding: 0 !important; /* Let @page handle margins */
      }
    }
  `;

  const renderTemplate = () => {
    switch (data.templateId) {
      case 'minimalist':
        return <MinimalistTemplate data={data} />;
      case 'sidebar':
        return <SidebarTemplate data={data} />;
      case 'tech':
        return <TechTemplate data={data} />;
      case 'professional':
        return <ProfessionalTemplate data={data} />;
      case 'creative':
        return <CreativeTemplate data={data} />;
      case 'executive':
        return <ExecutiveTemplate data={data} />;
      case 'compact':
        return <CompactTemplate data={data} />;
      case 'swiss':
        return <SwissTemplate data={data} />; // Added Swiss
      case 'academic':
        return <AcademicTemplate data={data} />;
      case 'elegant':
        return <ElegantTemplate data={data} />;
      case 'opal':
        return <OpalTemplate data={data} />;
      case 'wireframe':
        return <WireframeTemplate data={data} />;
      case 'berlin':
        return <BerlinTemplate data={data} />;
      case 'lateral':
        return <LateralTemplate data={data} />;
      case 'iron':
        return <IronTemplate data={data} />;
      case 'ginto':
        return <GintoTemplate data={data} />;
      case 'symmetry':
        return <SymmetryTemplate data={data} />;
      case 'bronx':
        return <BronxTemplate data={data} />;
      case 'path':
        return <PathTemplate data={data} />;
      case 'quartz':
        return <QuartzTemplate data={data} />;
      case 'silk':
        return <SilkTemplate data={data} />;
      case 'mono':
        return <MonoTemplate data={data} />;
      case 'pop':
        return <PopTemplate data={data} />;
      case 'noir':
        return <NoirTemplate data={data} />;
      case 'paper':
        return <PaperTemplate data={data} />;
      case 'cast':
        return <CastTemplate data={data} />;
      case 'moda':
        return <ModaTemplate data={data} />;
      default:
        return <ModernTemplate data={data} />;
    }
  };

  return (
    <div className={containerClass} id="resume-preview-container">
      <style>{printStyles}</style>

      {/* Visual Page Break Marker (screen only) */}
      {/* Visual Page Break Marker (screen only) */}
      <div
        className="absolute inset-0 pointer-events-none z-50 print:hidden"
        style={{
          // Creates a subtle dashed line effect at A4 intervals (297mm)
          backgroundImage: `
            linear-gradient(to right, #94a3b8 50%, transparent 50%),
            linear-gradient(to right, #94a3b8 50%, transparent 50%)
          `,
          backgroundSize: '12px 1px',
          backgroundPosition: '0 297mm', // Start at first page break
          backgroundRepeat: 'repeat-x',
          // Use a second gradient to repeat this line vertically every 297mm
          maskImage: 'linear-gradient(to bottom, transparent 296.8mm, black 296.8mm, black 297.2mm, transparent 297.2mm)',
          maskSize: '100% 297mm',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 296.8mm, black 296.8mm, black 297.2mm, transparent 297.2mm)',
          WebkitMaskSize: '100% 297mm',
          opacity: 0.4
        }}
      />
      {/* Page Number Indicators (Approximate for first few pages) */}
      <div className="absolute top-[297mm] right-0 w-full border-t border-transparent z-50 print:hidden pointer-events-none">
        <div className="absolute right-2 -top-3 text-[10px] text-slate-400 font-sans bg-white/80 px-1 rounded">Page 2 Start</div>
      </div>
      <div className="absolute top-[594mm] right-0 w-full border-t border-transparent z-50 print:hidden pointer-events-none">
        <div className="absolute right-2 -top-3 text-[10px] text-slate-400 font-sans bg-white/80 px-1 rounded">Page 3 Start</div>
      </div>

      {renderTemplate()}
    </div>
  );
};
export default ResumePreview;