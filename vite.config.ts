import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Automatically detect base path for GitHub Pages and local environments:
// 1. BASE_PATH env var (provided by actions/configure-pages or custom deploy)
// 2. GITHUB_REPOSITORY (e.g. 'username/repo-name' in GitHub Actions) -> '/repo-name/'
// 3. Fallback to './' for local preview or custom subdirectories
const getBasePath = () => {
  if (process.env.BASE_PATH) {
    return process.env.BASE_PATH.endsWith('/') ? process.env.BASE_PATH : `${process.env.BASE_PATH}/`;
  }
  if (process.env.GITHUB_REPOSITORY) {
    const repo = process.env.GITHUB_REPOSITORY.split('/')[1];
    return repo ? `/${repo}/` : './';
  }
  return './';
};

export default defineConfig(() => {
  return {
    base: getBasePath(),
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
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
