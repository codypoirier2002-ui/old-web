// Small HTML builders. Every piece of text goes through esc(), including
// anything the AI writer returns, so pages can never inject markup.
import { esc } from '../core/util.js';

export { esc };

export function lnk(url, text, o = {}) {
  let a = `<a data-go="${esc(url)}"`;
  if (o.topic) a += ` data-topic="${esc(o.topic)}"`;
  if (o.site) a += ` data-site="${esc(o.site)}"`;
  if (o.kind) a += ` data-kind="${esc(o.kind)}"`;
  if (o.t) a += ` data-t="${esc(o.t)}"`;
  if (o.cls) a += ` class="${o.cls}"`;
  if (o.style) a += ` style="${o.style}"`;
  return `${a}>${o.html != null ? o.html : esc(text)}</a>`;
}

// Link from a {url, name, topic, kind} object made by core/links.js
export const siteA = (s, text, o = {}) => lnk(s.url, text ?? s.name, { topic: s.topic, site: s.site, kind: s.kind, ...o });

export const gl = (text, o = {}) =>
  `<button type="${o.type || 'button'}" class="gl ${o.cls || ''}"${o.act ? ` data-act="${o.act}"` : ''}${o.go ? ` data-go="${esc(o.go)}"` : ''}${o.style ? ` style="${o.style}"` : ''}>${o.html ?? esc(text)}</button>`;

// Turn plain text into paragraphs, keeping line breaks.
export function paras(text) {
  return String(text ?? '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export const br = (text) => esc(text).replace(/\n/g, '<br>');

export const each = (arr, fn) => (Array.isArray(arr) ? arr.map(fn).join('') : '');
