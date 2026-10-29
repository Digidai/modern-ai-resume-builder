import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';
import { preloadPage } from './routes';
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

// Keep the pre-rendered page on screen until this page's chunk is loaded, then mount.
const basename = computeBasename();
const path = basename === '/' ? window.location.pathname : window.location.pathname.slice(basename.length) || '/';
await preloadPage(path);

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
