import { defineConfig } from 'vite';
import { oldWebAi } from './server/plugin.js';

export default defineConfig({
  // Relative paths so the build works on GitHub Pages under /old-web/
  base: './',
  plugins: [oldWebAi()],
  build: {
    target: ['es2019', 'safari13'],
    cssTarget: ['safari13'],
  },
  server: { host: true },
  preview: { host: true },
});
