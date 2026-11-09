import React, { Suspense, lazy } from 'react';
import { ResumeData } from '../types';
import { DEFAULT_TEMPLATE_ID, TEMPLATE_IDS, TemplateId, currentTemplateId } from '../constants/templates';

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

export const TEMPLATE_LOADERS: Record<TemplateId, TemplateLoader> = {
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
  classic: () => import('./templates/ClassicTemplate').then((module) => ({ default: module.ClassicTemplate })),
  ivy: () => import('./templates/IvyTemplate').then((module) => ({ default: module.IvyTemplate })),
  banking: () => import('./templates/LedgerTemplate').then((module) => ({ default: module.LedgerTemplate })),
  vanguard: () => import('./templates/VanguardTemplate').then((module) => ({ default: module.VanguardTemplate })),
  duo: () => import('./templates/DuoTemplate').then((module) => ({ default: module.DuoTemplate })),
  timeline: () => import('./templates/TimelineTemplate').then((module) => ({ default: module.TimelineTemplate })),
  meridian: () => import('./templates/MeridianTemplate').then((module) => ({ default: module.MeridianTemplate })),
  keystone: () => import('./templates/KeystoneTemplate').then((module) => ({ default: module.KeystoneTemplate })),
  vital: () => import('./templates/VitalTemplate').then((module) => ({ default: module.VitalTemplate })),
  altitude: () => import('./templates/AltitudeTemplate').then((module) => ({ default: module.AltitudeTemplate })),
  halo: () => import('./templates/HaloTemplate').then((module) => ({ default: module.HaloTemplate })),
  plain: () => import('./templates/PlainTemplate').then((module) => ({ default: module.PlainTemplate })),
  text: () => import('./templates/TextTemplate').then((module) => ({ default: module.TextTemplate })),
  graduate: () => import('./templates/GraduateTemplate').then((module) => ({ default: module.GraduateTemplate })),
  wallstreet: () => import('./templates/WallStreetTemplate').then((module) => ({ default: module.WallStreetTemplate })),
  scholar: () => import('./templates/ScholarTemplate').then((module) => ({ default: module.ScholarTemplate })),
  oxford: () => import('./templates/OxfordTemplate').then((module) => ({ default: module.OxfordTemplate })),
  standard: () => import('./templates/StandardTemplate').then((module) => ({ default: module.StandardTemplate })),
  lumen: () => import('./templates/LumenTemplate').then((module) => ({ default: module.LumenTemplate })),
  federal: () => import('./templates/FederalTemplate').then((module) => ({ default: module.FederalTemplate })),
  europa: () => import('./templates/EuropaTemplate').then((module) => ({ default: module.EuropaTemplate })),
  tokyo: () => import('./templates/TokyoTemplate').then((module) => ({ default: module.TokyoTemplate })),
  jade: () => import('./templates/JadeTemplate').then((module) => ({ default: module.JadeTemplate })),
  portrait: () => import('./templates/PortraitTemplate').then((module) => ({ default: module.PortraitTemplate })),
  munich: () => import('./templates/MunichTemplate').then((module) => ({ default: module.MunichTemplate })),
  onyx: () => import('./templates/OnyxTemplate').then((module) => ({ default: module.OnyxTemplate })),
  riviera: () => import('./templates/RivieraTemplate').then((module) => ({ default: module.RivieraTemplate })),
  summit: () => import('./templates/SummitTemplate').then((module) => ({ default: module.SummitTemplate })),
  seoul: () => import('./templates/SeoulTemplate').then((module) => ({ default: module.SeoulTemplate })),
  dubai: () => import('./templates/DubaiTemplate').then((module) => ({ default: module.DubaiTemplate })),
  manila: () => import('./templates/ManilaTemplate').then((module) => ({ default: module.ManilaTemplate })),
  linen: () => import('./templates/LinenTemplate').then((module) => ({ default: module.LinenTemplate })),
  banner: () => import('./templates/BannerTemplate').then((module) => ({ default: module.BannerTemplate })),
  wave: () => import('./templates/WaveTemplate').then((module) => ({ default: module.WaveTemplate })),
  frame: () => import('./templates/FrameTemplate').then((module) => ({ default: module.FrameTemplate })),
  essential: () => import('./templates/EssentialTemplate').then((module) => ({ default: module.EssentialTemplate })),
  capital: () => import('./templates/CapitalTemplate').then((module) => ({ default: module.CapitalTemplate })),
  campus: () => import('./templates/CampusTemplate').then((module) => ({ default: module.CampusTemplate })),
  clarity: () => import('./templates/SimpleTemplates').then((module) => ({ default: module.ClarityTemplate })),
  harbor: () => import('./templates/SimpleTemplates').then((module) => ({ default: module.HarborTemplate })),
  metro: () => import('./templates/SimpleTemplates').then((module) => ({ default: module.MetroTemplate })),
  atlas: () => import('./templates/SimpleTemplates').then((module) => ({ default: module.AtlasTemplate })),
  chronicle: () => import('./templates/SimpleTemplates').then((module) => ({ default: module.ChronicleTemplate })),
  aurora: () => import('./templates/SimpleTemplates').then((module) => ({ default: module.AuroraTemplate })),
  nova: () => import('./templates/SimpleTemplates').then((module) => ({ default: module.NovaTemplate })),
  cameo: () => import('./templates/SimpleTemplates').then((module) => ({ default: module.CameoTemplate })),
  sterling: () => import('./templates/SimpleTemplates').then((module) => ({ default: module.SterlingTemplate })),
  meadow: () => import('./templates/SimpleTemplates').then((module) => ({ default: module.MeadowTemplate })),
  cobalt: () => import('./templates/SimpleTemplates').then((module) => ({ default: module.CobaltTemplate })),
  granite: () => import('./templates/SimpleTemplates').then((module) => ({ default: module.GraniteTemplate })),
  bedrock: () => import('./templates/SimpleTemplates').then((module) => ({ default: module.BedrockTemplate })),
  linear: () => import('./templates/SimpleTemplates').then((module) => ({ default: module.LinearTemplate })),
  vista: () => import('./templates/SimpleTemplates').then((module) => ({ default: module.VistaTemplate })),
  ember: () => import('./templates/SimpleTemplates').then((module) => ({ default: module.EmberTemplate })),
  sage: () => import('./templates/SimpleTemplates').then((module) => ({ default: module.SageTemplate })),
  folio: () => import('./templates/SimpleTemplates').then((module) => ({ default: module.FolioTemplate })),
  slate: () => import('./templates/SimpleTemplates').then((module) => ({ default: module.SlateTemplate })),
  marble: () => import('./templates/SimpleTemplates').then((module) => ({ default: module.MarbleTemplate })),
  willow: () => import('./templates/SimpleTemplates').then((module) => ({ default: module.WillowTemplate })),
  ivory: () => import('./templates/SimpleTemplates').then((module) => ({ default: module.IvoryTemplate })),
  prism: () => import('./templates/PrismTemplate').then((module) => ({ default: module.PrismTemplate })),
};

const resolveTemplateId = (templateId: string): TemplateId => {
  const id = currentTemplateId(templateId);
  return id in TEMPLATE_LOADERS ? (id as TemplateId) : DEFAULT_TEMPLATE_ID;
};

// Templates whose chunk has loaded render directly: `lazy` alone would suspend once even then.
const loadedTemplates: Partial<Record<TemplateId, TemplateComponent>> = {};
const loadTemplate = (templateId: TemplateId) =>
  TEMPLATE_LOADERS[templateId]().then((module) => {
    loadedTemplates[templateId] = module.default;
    return module;
  });

const TEMPLATES = TEMPLATE_IDS.reduce<Record<TemplateId, React.LazyExoticComponent<TemplateComponent>>>(
  (map, templateId) => {
    map[templateId] = createLazyTemplate(() => loadTemplate(templateId));
    return map;
  },
  {} as Record<TemplateId, React.LazyExoticComponent<TemplateComponent>>
);

const TemplateFallback: React.FC = () => (
  <div className="w-full min-h-[120px] rounded-md bg-slate-100 dark:bg-slate-900 animate-pulse" data-template-loading="true" />
);

/**
 * Keeps a template whose chunk didn't arrive (offline) inside its own paper, so the editor around it
 * keeps working. Browsers keep failing that import until the page reloads, so it asks for a reload
 * once the connection is back; the resume is saved locally, so nothing is lost.
 */
class TemplateLoadBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  private connectionChanged = () => this.forceUpdate();

  componentDidMount() {
    window.addEventListener('online', this.connectionChanged);
    window.addEventListener('offline', this.connectionChanged);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.connectionChanged);
    window.removeEventListener('offline', this.connectionChanged);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div
        role="status"
        className="flex min-h-[320px] w-full flex-col items-center justify-center gap-3 rounded-md border border-dashed border-neutral-300 p-10 text-center text-neutral-500"
        data-template-failed="true"
      >
        <p className="text-lg font-medium text-neutral-700">This template couldn’t load.</p>
        {/* Text only: the editor shows inert copies of the paper, so a button here couldn't be clicked. */}
        <p className="max-w-md text-base">
          {navigator.onLine ? 'Reload the page to show it. Your edits are saved.' : 'You’re offline. Reload the page once you’re back online; your edits are saved.'}
        </p>
      </div>
    );
  }
}

export const preloadResumeTemplate = async (templateId: string): Promise<void> => {
  await loadTemplate(resolveTemplateId(templateId));
};

export const ResumeTemplateRenderer: React.FC<ResumeTemplateRendererProps> = ({ data, templateId }) => {
  const resolvedId = resolveTemplateId(templateId);
  // No Suspense boundary once loaded: prerendering would emit a large one out of order (with an inline
  // script the CSP blocks), and the client preloads the prerendered templates so hydration matches.
  const Loaded = loadedTemplates[resolvedId];
  if (Loaded) return <Loaded data={data} />;

  const Template = TEMPLATES[resolvedId];
  return (
    <TemplateLoadBoundary key={resolvedId}>
      <Suspense fallback={<TemplateFallback />}>
        <Template data={data} />
      </Suspense>
    </TemplateLoadBoundary>
  );
};
