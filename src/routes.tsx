import { lazy, type ComponentType } from 'react';

// Each page is its own chunk, so a visitor downloads only the page they open. Pages are
// pre-rendered as static HTML, which stays on screen until React mounts: index.tsx loads the
// current page's chunk before the first render, so the page never flashes empty. Later
// navigations are React transitions, which keep the previous page visible while a chunk loads.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loader = () => Promise<{ default: ComponentType<any> }>;

const page = (load: Loader) => {
  let loaded: ComponentType<Record<string, unknown>> | undefined;
  let promise: ReturnType<Loader> | undefined;
  const preload = () =>
    (promise ??= load().then((module) => {
      loaded = module.default;
      return module;
    }));
  const Lazy = lazy(preload);
  // Once the chunk is in, render it directly: `lazy` alone would suspend for one tick even then,
  // and that would replace the pre-rendered page with the (empty) fallback.
  const Page = (props: Record<string, unknown>) => {
    const Loaded = loaded;
    return Loaded ? <Loaded {...props} /> : <Lazy {...props} />;
  };
  return Object.assign(Page, { preload });
};

export const HomeView = page(() => import('./views/HomeView'));
export const JobTitles = page(() => import('./components/JobTitles'));
export const TemplateSelector = page(() => import('./components/TemplateSelector'));
export const TemplatesView = page(() => import('./views/TemplatesView'));
export const TemplateDetailView = page(() => import('./views/TemplateDetailView'));
export const EditorView = page(() => import('./views/EditorView'));
export const AgentsView = page(() => import('./views/AgentsView'));
export const RenderView = page(() => import('./views/RenderView'));
export const NotFoundView = page(() => import('./views/NotFoundView'));

/** The page component for a path (without the basename), matching the routes in App.tsx. */
const pageForPath = (path: string) => {
  const p = path.replace(/\/+$/, '') || '/';
  if (p === '/') return HomeView;
  if (p === '/directory') return JobTitles;
  if (/^\/resume_tmpl\/[^/]+$/.test(p)) return TemplateSelector;
  if (p === '/templates') return TemplatesView;
  if (/^\/templates\/[^/]+$/.test(p)) return TemplateDetailView;
  if (p === '/editor') return EditorView;
  if (p === '/agents') return AgentsView;
  if (p === '/render') return RenderView;
  if (p.startsWith('/dev/')) return null;
  return NotFoundView;
};

/** Loads the chunk for the page at `path`; resolves even if it fails (React shows the error later). */
export const preloadPage = (path: string): Promise<unknown> => pageForPath(path)?.preload().catch(() => undefined) ?? Promise.resolve();
