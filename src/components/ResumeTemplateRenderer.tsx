import React, { Suspense, lazy } from 'react';
import { ResumeData } from '../types';

interface ResumeTemplateRendererProps {
  data: ResumeData;
  templateId: string;
}

interface TemplateProps {
  data: ResumeData;
}

type TemplateComponent = React.ComponentType<TemplateProps>;
type TemplateLoader = () => Promise<{ default: TemplateComponent }>;

const createLazyTemplate = (loader: TemplateLoader): React.LazyExoticComponent<TemplateComponent> => lazy(loader);

const TEMPLATE_LOADERS: Record<string, TemplateLoader> = {
  modern: () => import('./templates/ModernTemplate').then((module) => ({ default: module.ModernTemplate })),
  minimalist: () => import('./templates/MinimalistTemplate').then((module) => ({ default: module.MinimalistTemplate })),
  sidebar: () => import('./templates/SidebarTemplate').then((module) => ({ default: module.SidebarTemplate })),
  executive: () => import('./templates/ExecutiveTemplate').then((module) => ({ default: module.ExecutiveTemplate })),
  creative: () => import('./templates/CreativeTemplate').then((module) => ({ default: module.CreativeTemplate })),
  compact: () => import('./templates/CompactTemplate').then((module) => ({ default: module.CompactTemplate })),
  tech: () => import('./templates/TechTemplate').then((module) => ({ default: module.TechTemplate })),
  professional: () => import('./templates/ProfessionalTemplate').then((module) => ({ default: module.ProfessionalTemplate })),
  academic: () => import('./templates/AcademicTemplate').then((module) => ({ default: module.AcademicTemplate })),
  elegant: () => import('./templates/ElegantTemplate').then((module) => ({ default: module.ElegantTemplate })),
  swiss: () => import('./templates/SwissTemplate').then((module) => ({ default: module.SwissTemplate })),
  opal: () => import('./templates/OpalTemplate').then((module) => ({ default: module.OpalTemplate })),
  wireframe: () => import('./templates/WireframeTemplate').then((module) => ({ default: module.WireframeTemplate })),
  berlin: () => import('./templates/BerlinTemplate').then((module) => ({ default: module.BerlinTemplate })),
  lateral: () => import('./templates/LateralTemplate').then((module) => ({ default: module.LateralTemplate })),
  iron: () => import('./templates/IronTemplate').then((module) => ({ default: module.IronTemplate })),
  ginto: () => import('./templates/GintoTemplate').then((module) => ({ default: module.GintoTemplate })),
  symmetry: () => import('./templates/SymmetryTemplate').then((module) => ({ default: module.SymmetryTemplate })),
  bronx: () => import('./templates/BronxTemplate').then((module) => ({ default: module.BronxTemplate })),
  path: () => import('./templates/PathTemplate').then((module) => ({ default: module.PathTemplate })),
  quartz: () => import('./templates/QuartzTemplate').then((module) => ({ default: module.QuartzTemplate })),
  silk: () => import('./templates/SilkTemplate').then((module) => ({ default: module.SilkTemplate })),
  mono: () => import('./templates/MonoTemplate').then((module) => ({ default: module.MonoTemplate })),
  pop: () => import('./templates/PopTemplate').then((module) => ({ default: module.PopTemplate })),
  noir: () => import('./templates/NoirTemplate').then((module) => ({ default: module.NoirTemplate })),
  paper: () => import('./templates/PaperTemplate').then((module) => ({ default: module.PaperTemplate })),
  cast: () => import('./templates/CastTemplate').then((module) => ({ default: module.CastTemplate })),
  moda: () => import('./templates/ModaTemplate').then((module) => ({ default: module.ModaTemplate })),
};

const TEMPLATES = Object.fromEntries(
  Object.entries(TEMPLATE_LOADERS).map(([templateId, loader]) => [templateId, createLazyTemplate(loader)])
) as Record<string, React.LazyExoticComponent<TemplateComponent>>;

const TemplateFallback: React.FC = () => (
  <div className="w-full min-h-[120px] rounded-md bg-slate-100 dark:bg-slate-900 animate-pulse" />
);

export const preloadResumeTemplate = async (templateId: string): Promise<void> => {
  const loader = TEMPLATE_LOADERS[templateId] || TEMPLATE_LOADERS.modern;
  await loader();
};

export const ResumeTemplateRenderer: React.FC<ResumeTemplateRendererProps> = ({ data, templateId }) => {
  const Template = TEMPLATES[templateId] || TEMPLATES.modern;
  return (
    <Suspense fallback={<TemplateFallback />}>
      <Template data={data} />
    </Suspense>
  );
};
