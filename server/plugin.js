// Vite plugin: mounts the AI writer on the dev server and the preview server.
// Reads ANTHROPIC_API_KEY from .env.local (or your shell). Only variables
// starting with VITE_ ever reach the browser, so the key never does.
import { loadEnv } from 'vite';
import { createAiWriter } from './ai.js';

export function oldWebAi() {
  let writer = null;
  const mount = (server) => {
    server.middlewares.use(writer.middleware);
    setTimeout(() => console.log(`\n  [old-web] ${writer.describe()}\n`), 50);
  };
  return {
    name: 'old-web-ai',
    configResolved(config) {
      const env = loadEnv(config.mode, config.envDir || config.root, '');
      writer = createAiWriter({
        apiKey: env.ANTHROPIC_API_KEY,
        baseURL: env.ANTHROPIC_BASE_URL,
        cap: Math.max(0, parseInt(env.OLDWEB_DAILY_CAP, 10) || 150),
        root: config.root,
      });
    },
    configureServer: mount,
    configurePreviewServer: mount,
  };
}
