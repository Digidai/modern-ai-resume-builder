import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';
import { preloadPage } from './routes';
import { preloadRoleExample } from './data/roleExamples';
import { preloadResumeTemplate } from './components/ResumeTemplateRenderer';
import { isPrerendered } from './prerender';
import './resumeFonts';
import { ThemeProvider } from './contexts/ThemeContext';

const computeBasename = () => {
  if (import.meta.env.DEV) return '/';
  try {
    const { pathname } = new URL(import.meta.url);
    if (pathname.includes('/assets/')) {
      const base = pathname.split('/assets/')[0];
      return base || '/';
    }
  } catch {
    // Ignore and fall back to '/'
  }
  return '/';
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Each deploy replaces the hashed chunks, so a tab opened before a deploy can fail to load a
// page's chunk (404). Reload once to pick up the new build; the timestamp stops a reload loop.
window.addEventListener('vite:preloadError', (event) => {
  const key = 'chunkReloadAt';
  const last = Number(sessionStorage.getItem(key)) || 0;
  if (Date.now() - last < 10_000) return;
  sessionStorage.setItem(key, String(Date.now()));
  event.preventDefault();
  window.location.reload();
});

// Keep the prerendered page on screen until this page's chunk (and a job page's example) is loaded.
const basename = computeBasename();
const path = basename === '/' ? window.location.pathname : window.location.pathname.slice(basename.length) || '/';
const job = path.match(/^\/resume_tmpl\/([^/]+)\/?$/);
// The templates the prerendered previews show load first too, so hydration keeps every preview as it is.
const shownTemplates = new Set(Array.from(rootElement.querySelectorAll<HTMLElement>('[data-template-id]'), (el) => el.dataset.templateId ?? ''));
await Promise.all([
  preloadPage(path),
  job ? preloadRoleExample(job[1]) : undefined,
  ...Array.from(shownTemplates, (id) => preloadResumeTemplate(id).catch(() => undefined)),
]);

const app = (
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);

// Pages are prerendered without a query string (src/entry-server.tsx); a query these pages render from
// would not match it, so those are rendered afresh.
const query = new URLSearchParams(window.location.search);
if (isPrerendered && !query.has('q') && !query.has('filter')) {
  ReactDOM.hydrateRoot(rootElement, app);
} else {
  ReactDOM.createRoot(rootElement).render(app);
}
