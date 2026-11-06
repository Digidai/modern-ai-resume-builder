import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ isSsrBuild }) => ({
  // Use absolute paths to support deep linking (SPA routing) correctly.
  base: '/',
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['pdf-lib'],
  },
  build: {
    // Pin a single SPA entry to avoid accidentally treating generated dist HTML files as build inputs.
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
    },
    // Dist can contain thousands of generated static role pages; full deletion is extremely slow.
    emptyOutDir: false,
    // The prerender bundle (src/entry-server.tsx) only renders HTML; public/ belongs to the site build.
    copyPublicDir: !isSsrBuild,
    // Never inline font files: a stylesheet lists every unicode subset, and the browser fetches only
    // the ones a page uses, but an inlined subset is downloaded with the CSS whether it is used or not.
    assetsInlineLimit: (file) => (/\.(woff2?|ttf|otf)$/.test(file) ? false : undefined),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}));
