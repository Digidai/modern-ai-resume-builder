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
    'sidebar', 'creative', 'professional', 'swiss', 'opal', 'wireframe', 'berlin',
    'lateral', 'iron', 'ginto', 'symmetry', 'bronx', 'path', 'quartz', 'silk',
    'mono', 'pop', 'noir', 'paper', 'cast', 'moda'
  ];

  const isFullBleed = fullBleedTemplates.includes(data.templateId);
  const containerClass = isFullBleed
    ? "resume-preview-container bg-white text-slate-900 w-full h-full min-h-[29.7cm] shadow-xl print:shadow-none overflow-hidden print:overflow-visible flex flex-col"
    : wrapperClass;

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
      {/* Visual Page Break Marker (screen only) */}
      <div
        className="absolute inset-x-0 top-0 bottom-0 pointer-events-none z-50 print:hidden opacity-50"
        style={{
          backgroundImage: 'linear-gradient(to bottom, transparent calc(297mm - 1px), red calc(297mm - 1px), red 297mm)',
          backgroundSize: '100% 297mm'
        }}
      >
        <div className="sticky top-2 right-2 text-[10px] text-red-500 font-mono text-right pr-2">
          Page 1<br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br />
          ---- PAGE BREAK ----
        </div>
      </div>

      {renderTemplate()}
    </div>
  );
};
export default ResumePreview;