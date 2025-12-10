import React from 'react';
import { ResumeData } from '../types';
import { ModernTemplate, MinimalistTemplate, SidebarTemplate, ExecutiveTemplate, CreativeTemplate, CompactTemplate, TechTemplate, ProfessionalTemplate, AcademicTemplate, ElegantTemplate, SwissTemplate, OpalTemplate, WireframeTemplate, BerlinTemplate, LateralTemplate, IronTemplate, GintoTemplate, SymmetryTemplate, BronxTemplate, PathTemplate, QuartzTemplate, SilkTemplate, MonoTemplate, PopTemplate, NoirTemplate, PaperTemplate, CastTemplate, ModaTemplate } from './ResumeTemplates';

interface ResumePreviewProps {
  data: ResumeData;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ data }) => {
  // Common wrapper styling for the paper effect
  // print:p-[2cm] ensures standard margins for non-sidebar templates when @page margin is 0
  const wrapperClass = "resume-preview-container bg-white text-slate-900 w-full h-full min-h-[29.7cm] shadow-xl p-12 md:p-16 print:p-[1.5cm] overflow-hidden relative";

  // Templates that handle their own full-bleed layout
  const isFullBleed = data.templateId === 'sidebar' || data.templateId === 'creative';
  const containerClass = isFullBleed
    ? "resume-preview-container bg-white text-slate-900 w-full h-full min-h-[29.7cm] shadow-xl overflow-hidden"
    : wrapperClass;

  const renderTemplate = () => {
    switch (data.templateId) {
      case 'minimalist':
        return <MinimalistTemplate data={data} />;
      case 'sidebar':
        return <SidebarTemplate data={data} />;
      case 'executive':
        return <ExecutiveTemplate data={data} />;
      case 'creative':
        return <CreativeTemplate data={data} />;
      case 'compact':
        return <CompactTemplate data={data} />;
      case 'tech':
        return <TechTemplate data={data} />;
      case 'professional':
        return <ProfessionalTemplate data={data} />;
      case 'academic':
        return <AcademicTemplate data={data} />;
      case 'elegant':
        return <ElegantTemplate data={data} />;
      case 'swiss':
        return <SwissTemplate data={data} />;
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
      case 'modern':
      default:
        return <ModernTemplate data={data} />;
    }
  };

  return (
    <div className={containerClass}>
      {renderTemplate()}
    </div>
  );
};

export default ResumePreview;