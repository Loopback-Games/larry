import { defineConfig } from 'vite';

/**
 * The site is served from a project page, so asset URLs need the repository
 * name as a base. `BASE_PATH` lets the deploy workflow override it.
 */
export default defineConfig({
  base: process.env.BASE_PATH ?? '/larry/',
  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
  server: {
    port: 5173,
    strictPort: false,
  },
});
