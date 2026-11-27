// Addresses on the fake internet. Everything is "http://" and lives in 2012.
import { REAL_DOMAINS } from './lex.js';

export const HOSTS = {
  portal: 'www.startblaster.net',
  news: 'news.startblaster.net',
  search: 'www.searchasaurus.com',
  video: 'www.vidoodle.com',
  mail: 'www.mailmole.com',
  games: 'www.arcadeville.net',
  chat: 'www.chatterboxchat.net',
  howto: 'www.howtotown.com',
  blogs: 'blogaroo.com',
  freehost: 'members.bubblehost.net',
};

export const HOME = `http://${HOSTS.portal}/`;

export function searchUrl(q, page = 1) {
  const enc = encodeURIComponent(String(q).trim()).replace(/%20/g, '+');
  return `http://${HOSTS.search}/search?q=${enc}${page > 1 ? `&p=${page}` : ''}`;
}

function cleanPath(pathname) {
  let path = pathname || '/';
  path = path.replace(/\/{2,}/g, '/');
  path = path.replace(/\/index\.s?html?$/i, '/');
  if (/^\/~[^/]+$/.test(path)) path += '/';
  if (path.length > 1 && path.endsWith('/') && !/^\/~[^/]+\/$/.test(path)) path = path.slice(0, -1);
  return path || '/';
}

// Canonical form used as the cache key.
export function canon(url) {
  const s = String(url).trim();
  if (/^about:/i.test(s)) return 'about:' + s.slice(6).toLowerCase().replace(/[^a-z0-9-]/g, '');
  let u;
  try { u = new URL(s); } catch { return null; }
  if (!/^https?:$/.test(u.protocol)) return null;
  const host = u.hostname.toLowerCase().replace(/\.$/, '');
  if (!host || !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/.test(host)) return null;
  const port = u.port && u.port !== '80' && u.port !== '443' ? ':' + u.port : '';
  const params = [...u.searchParams.entries()].filter(([k]) => k);
  const search = params.length ? '?' + params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v).replace(/%20/g, '+')}`).join('&') : '';
  return `http://${host}${port}${cleanPath(u.pathname).toLowerCase()}${search}`;
}

export function parse(url) {
  const c = canon(url);
  if (!c) return null;
  if (c.startsWith('about:')) return { url: c, about: true, host: '', path: c.slice(6), query: new URLSearchParams(), parts: [] };
  const u = new URL(c);
  let path = u.pathname;
  try { path = decodeURIComponent(path); } catch { /* keep */ }
  return {
    url: c,
    about: false,
    host: u.hostname,
    path,
    query: u.searchParams,
    parts: path.split('/').filter(Boolean),
  };
}

// What the person typed in the address bar -> an address (or a search).
export function fromInput(text) {
  const t = String(text || '').trim();
  if (!t) return null;
  if (/^about:/i.test(t)) return canon(t);
  if (/^https?:\/\//i.test(t)) return canon(t) || searchUrl(t);
  if (/^(localhost|\d{1,3}(\.\d{1,3}){3})(:\d+)?(\/\S*)?$/i.test(t)) return canon('http://' + t);
  if (/^[^\s/?#]+\.[a-z]{2,12}(:\d+)?([/?#]\S*)?$/i.test(t)) return canon('http://' + t) || searchUrl(t);
  if (/^www\.[^\s]+$/i.test(t)) return canon('http://' + t) || searchUrl(t);
  return searchUrl(t);
}

export function registrable(host) {
  const labels = host.split('.');
  if (labels.length < 2) return host;
  let i = labels.length - 2;
  if (labels.length > 2 && /^(co|com|org|net|ac|gov)$/.test(labels[i]) && labels[labels.length - 1].length === 2) i--;
  return labels[i];
}

const REAL = new Set(REAL_DOMAINS);
export function isRealDomain(host) {
  if (!host) return false;
  return REAL.has(registrable(host).replace(/-/g, ''));
}

export function shortUrl(url) {
  return String(url).replace(/^http:\/\//, '');
}
