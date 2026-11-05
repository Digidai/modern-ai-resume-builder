// Build-time prerendering: scripts/seo-postbuild.mjs renders each page with this bundle
// (`vite build --ssr`) into its HTML, and src/index.tsx hydrates it. Pages render with the sample
// resume, the light theme and no query string; the client keeps that markup and then applies the
// visitor's own resume before the first paint.
import { StrictMode } from 'react';
import { prerender } from 'react-dom/static';
import { StaticRouter } from 'react-router';
import App from './App';
import { preloadPage } from './routes';
import { ThemeProvider } from './contexts/ThemeContext';
import { setServerSiteUrl } from './hooks/useSeo';
import { loadRoleExample } from './data/roleExamples';
import { findJobTitleBySlug } from './utils/slug';
import jobTitlesData from './data/jobTitles.json';
import { INITIAL_RESUME_DATA } from './types';
import { RESUME_FIELDS } from './hooks/useResumeData';
import { SAVED_RESUME_PREFIX, hashStoredFields } from './prerender';
import { preloadResumeTemplate } from './components/ResumeTemplateRenderer';
import { TEMPLATE_IDS } from './constants/templates';

const ALL_JOB_TITLES = (jobTitlesData as Array<{ titles: string[] }>).flatMap((category) => category.titles);
// Loaded templates render without suspending, so each page comes out complete and in order.
let templatesLoaded: Promise<unknown> | undefined;

/** The markup of the page at `path` (no basename, no query), for `<div id="root">`. */
export const render = async (path: string, siteUrl: string): Promise<string> => {
  setServerSiteUrl(siteUrl);
  await Promise.all([preloadPage(path), (templatesLoaded ??= Promise.all(TEMPLATE_IDS.map(preloadResumeTemplate)))]);
  const job = path.match(/^\/resume_tmpl\/([^/]+)\/?$/);
  const jobTitle = job && findJobTitleBySlug(job[1], ALL_JOB_TITLES);
  if (jobTitle) await loadRoleExample(jobTitle);

  const { prelude } = await prerender(
    <StrictMode>
      <ThemeProvider>
        <StaticRouter location={path}>
          <App />
        </StaticRouter>
      </ThemeProvider>
    </StrictMode>
  );
  return new Response(prelude).text();
};

/**
 * Inline script for <head>, run before the first paint: applies the dark theme, and marks a visitor
 * whose saved resume differs from the sample, so CSS hides the prerendered sample until hydration
 * swaps theirs in (src/index.css). The hash matches `hashStoredFields` over the stored fields.
 */
export const bootScript = (): string => {
  const sampleHash = hashStoredFields(
    RESUME_FIELDS.map((field) => (INITIAL_RESUME_DATA[field] === undefined ? null : JSON.stringify(INITIAL_RESUME_DATA[field])))
  );
  const fields = JSON.stringify(RESUME_FIELDS.map((field) => SAVED_RESUME_PREFIX + field));
  return `(function(){try{var d=document.documentElement,s=localStorage,t=s.getItem('theme');` +
    `if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))d.classList.add('dark');` +
    `var f=${fields},h=0,i,j,v;for(i=0;i<f.length;i++){v=s.getItem(f[i])||'';for(j=0;j<v.length;j++)h=(h*31+v.charCodeAt(j))|0;h=(h*31+124)|0}` +
    `if(s.getItem('resumeData')||(s.getItem('${SAVED_RESUME_PREFIX}version')&&h!==${sampleHash}))d.classList.add('saved-resume')}catch(e){}})()`;
};
