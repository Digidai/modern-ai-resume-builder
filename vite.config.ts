import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Use absolute paths to support deep linking (SPA routing) correctly.
  base: '/',
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
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
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
