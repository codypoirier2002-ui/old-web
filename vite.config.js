import { defineConfig } from 'vite';

export default defineConfig({
  // Relative paths so the build works on GitHub Pages under /old-web/
  base: './',
  build: {
    target: ['es2019', 'safari13'],
    cssTarget: ['safari13'],
  },
  server: { host: true },
});
