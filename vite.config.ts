import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

// Plugin to allow index.html on disk to refer to prebuilt ./assets/index.js (for direct GitHub Pages serving from root),
// while dynamically switching to /src/main.tsx during Vite dev and Vite build.
const htmlEntrySwitcher: Plugin = {
  name: 'html-entry-switcher',
  transformIndexHtml: {
    order: 'pre',
    handler(html) {
      // In Vite dev & build, point entry script to /src/main.tsx
      return html
        .replace(/<script[^>]*src=["']\.\/assets\/index\.js["'][^>]*><\/script>/gi, '<script type="module" src="/src/main.tsx"></script>')
        .replace(/<link[^>]*href=["']\.\/assets\/index\.css["'][^>]*>/gi, '');
    },
  },
};

export default defineConfig(() => {
  return {
    base: './',
    plugins: [htmlEntrySwitcher, react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
      },
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          entryFileNames: 'assets/index.js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name && assetInfo.name.endsWith('.css')) {
              return 'assets/index.css';
            }
            return 'assets/[name]-[hash].[ext]';
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
