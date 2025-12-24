import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
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

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter basename={computeBasename()}>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
