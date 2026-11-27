// Page registry: turns an address into a page record, and a page record
// into HTML. Page records are what gets cached, so a site looks the same
// when you come back.
import { parse, isRealDomain } from '../core/url.js';
import { getSite, siteKeyOf, relPath, siteRoot } from '../core/site.js';
import { Rng } from '../core/rng.js';
import { deslug } from '../core/util.js';
import { TYPES } from './types.js';

export const GEN_VERSION = 1;

// Which page type lives at which path, per kind of site.
export function route(site, rel, p) {
  const parts = rel.split('/').filter(Boolean);
  const q = p.query;
  const nf = { type: 'notFound', params: { path: rel } };
  const first = parts[0] || '';
  const tail = parts.slice(1).join('/');
  switch (site.kind) {
    case 'portal':
      if (rel === '/') return { type: 'portal', params: {} };
      if (['about', 'advertise', 'privacy'].includes(first) && parts.length === 1) return { type: 'portalInfo', params: { slug: first } };
      return nf;
    case 'news':
      if (rel === '/') return { type: 'newsHome', params: {} };
      if (first === 'story' && tail) return { type: 'article', params: { slug: tail } };
      return nf;
    case 'search':
      if (first === 'search') return q.get('q') ? { type: 'results', params: { q: q.get('q'), page: +q.get('p') || 1 } } : { type: 'searchHome', params: {} };
      return rel === '/' ? { type: 'searchHome', params: {} } : nf;
    case 'forum':
      if (rel === '/') return { type: 'forumIndex', params: {} };
      if (first === 'forum' && tail) return { type: 'board', params: { slug: tail, page: +q.get('p') || 1 } };
      if (first === 'thread' && tail) return { type: 'thread', params: { slug: tail } };
      return nf;
    case 'video':
      if (rel === '/') return { type: 'videoHome', params: { q: q.get('q') || '' } };
      if (first === 'watch' && tail) return { type: 'watch', params: { slug: tail } };
      if (first === 'user' && tail) return { type: 'channel', params: { user: tail } };
      if (first === 'results') return { type: 'videoHome', params: { q: q.get('q') || '' } };
      return nf;
    case 'fan':
      if (rel === '/') return { type: 'fan', params: {} };
      if (rel === '/guestbook.html') return { type: 'guestbook', params: {} };
      if (rel === '/links.html') return { type: 'links', params: {} };
      if (parts.length === 1 && /\.html?$/.test(first)) return { type: 'fanSub', params: { slug: first } };
      return nf;
    case 'clan':
      if (rel === '/') return { type: 'clan', params: {} };
      return nf;
    case 'trickshot':
      if (rel === '/') return { type: 'trickshot', params: { slug: '' } };
      if (parts.length === 1) return { type: 'trickshot', params: { slug: first } };
      return nf;
    case 'howto':
      if (rel === '/') return { type: 'howtoHome', params: { cat: '' } };
      if (first === 'category' && tail) return { type: 'howtoHome', params: { cat: tail } };
      if (parts.length === 1) return { type: 'guide', params: { slug: first } };
      return nf;
    case 'blog':
      if (rel === '/') return { type: 'blogHome', params: {} };
      if (parts.length === 3 && /^\d{4}$/.test(first)) return { type: 'blogPost', params: { slug: parts[2], month: +parts[1] || 11 } };
      return nf;
    case 'mail':
      if (rel === '/') return { type: 'inbox', params: { folder: 'inbox' } };
      if (first === 'folder' && tail) return { type: 'inbox', params: { folder: tail } };
      if (first === 'read' && tail) return { type: 'email', params: { id: tail } };
      return nf;
    case 'chat':
      if (rel === '/') return { type: 'chatLobby', params: {} };
      if (first === 'room' && tail) return { type: 'chatRoom', params: { slug: tail } };
      return nf;
    case 'games':
      if (rel === '/') return { type: 'gamesHome', params: { cat: '' } };
      if (first === 'category' && tail) return { type: 'gamesHome', params: { cat: tail } };
      if (first === 'play' && tail) return { type: 'game', params: { slug: tail } };
      return nf;
    default:
      if (rel === '/') return { type: 'personal', params: {} };
      if (parts.length === 1) return { type: 'personalSub', params: { slug: first } };
      return nf;
  }
}

// Everything a generator or renderer needs to know about one page.
export function makeCtx(page) {
  const p = parse(page.url);
  const r = new Rng(page.url);
  return {
    url: page.url,
    p,
    site: page.site,
    root: page.site ? siteRoot(page.site) : '',
    params: page.params || {},
    hint: page.hint || {},
    state: page.state || {},
    r,
    type: page.type,
    // Title from the address: "/thread/is-toast-soup" -> "is toast soup"
    slugTitle: page.params && page.params.slug ? deslug(page.params.slug) : '',
  };
}

export function resolve(url, hint = {}) {
  const p = parse(url);
  if (!p) return { url, type: 'notFound', params: { path: url }, site: null };
  if (p.about) return { url: p.url, type: 'about', params: { name: p.path || 'blank' }, site: null };
  if (isRealDomain(p.host)) return { url: p.url, type: 'noServer', params: { host: p.host }, site: null };
  const key = siteKeyOf(p);
  const site = getSite(key, hint);
  const { type, params } = route(site, relPath(p, key), p);
  return { url: p.url, type, params, site };
}

export function typeOf(type) {
  return TYPES[type] || TYPES.personal;
}

// Built-in generator. Returns a full page record.
export function generate(url, hint = {}) {
  const base = resolve(url, hint);
  const page = { ...base, hint: { t: hint.t ? String(hint.t).slice(0, 120) : '', from: hint.from ? String(hint.from).slice(0, 60) : '' } };
  const mod = typeOf(page.type);
  const ctx = makeCtx(page);
  page.content = mod.gen(ctx);
  page.title = mod.title(page.content, ctx);
  page.source = 'builtin';
  page.v = GEN_VERSION;
  page.t = Date.now();
  if (mod.ttl) page.exp = mod.ttl();
  return page;
}

export function render(page) {
  const mod = typeOf(page.type);
  const ctx = makeCtx(page);
  return { html: mod.render(page.content, ctx), ctx, mod };
}
