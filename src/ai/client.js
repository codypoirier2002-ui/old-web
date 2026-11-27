// Browser side of the AI writer. Asks the local server (never Anthropic
// directly) to write a page, then merges the result over the built-in page.
// On GitHub Pages, or without a key, this quietly stays off.
import { AI_TYPES } from './types.js';
import { merge } from './merge.js';
import { generate, makeCtx, typeOf } from '../pages/index.js';

const TYPES = new Set(AI_TYPES);
const HEADERS = { 'Content-Type': 'application/json', 'X-Old-Web': '1' };

export const ai = {
  status: { ai: false, used: 0, cap: 0, reason: 'checking' },
  get on() { return !!this.status.ai && this.status.reason !== 'cap'; },

  async probe() {
    if (import.meta.env.VITE_NO_AI) { this.status = { ai: false, used: 0, cap: 0, reason: 'static' }; return this.status; }
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 2500);
      const r = await fetch('api/status', { headers: { 'X-Old-Web': '1' }, signal: ctl.signal });
      clearTimeout(t);
      const j = r.ok && /json/.test(r.headers.get('content-type') || '') ? await r.json() : null;
      this.status = j && typeof j.ai === 'boolean' ? j : { ai: false, used: 0, cap: 0, reason: 'no-server' };
    } catch {
      this.status = { ai: false, used: 0, cap: 0, reason: 'no-server' };
    }
    return this.status;
  },

  wants(type) { return this.on && TYPES.has(type); },

  async write(page) {
    const c = page.content || {};
    const body = {
      type: page.type,
      url: page.url,
      title: page.hint && page.hint.t ? page.hint.t : (c.title || c.name || c.heading || c.subject || c.headline || page.title || ''),
      topic: page.site ? page.site.topic : '',
      siteName: page.site ? page.site.name : '',
      q: page.params && page.params.q ? page.params.q : '',
      from: page.hint && page.hint.from ? page.hint.from : c.from || '',
    };
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 75000);
    try {
      const r = await fetch('api/page', { method: 'POST', headers: HEADERS, body: JSON.stringify(body), signal: ctl.signal });
      const j = await r.json();
      if (typeof j.used === 'number') this.status = { ...this.status, used: j.used, cap: j.cap, reason: j.reason || '', ai: j.ai !== false };
      if (!j.ok || !j.content) throw new Error(j.reason || 'failed');
      return j.content;
    } finally {
      clearTimeout(t);
    }
  },
};

// Make a page: built-in first, then (if on) let Claude write over it.
export async function produce(url, hint, cb = {}, useAi = true) {
  const base = generate(url, hint);
  if (!useAi || !ai.wants(base.type)) return base;
  cb.onWait && cb.onWait();
  let p = 0;
  const creep = setInterval(() => { p += (0.95 - p) * 0.06; cb.onProgress && cb.onProgress(p); }, 250);
  try {
    const written = await ai.write(base);
    const content = merge(base.content, written);
    const page = { ...base, content, source: 'ai' };
    page.title = typeOf(page.type).title(content, makeCtx(page));
    return page;
  } catch (err) {
    console.info('[old-web] AI writer unavailable for this page, using the built-in generator:', err.message);
    return base;
  } finally {
    clearInterval(creep);
  }
}
