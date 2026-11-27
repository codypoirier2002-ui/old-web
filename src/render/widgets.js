// Period widgets, all drawn in code (CSS + inline SVG): hit counters,
// "under construction" signs, marquees, pictures, avatars.
import { Rng, hash } from '../core/rng.js';
import { esc } from './html.js';

export function counter(n, style = 'odo') {
  const digits = String(Math.max(0, Math.floor(n))).padStart(6, '0');
  return `<span class="ctr ctr-${style}" data-act="counter" data-n="${Math.max(0, Math.floor(n))}" title="hit counter">${[...digits].map((d) => `<i>${d}</i>`).join('')}</span>`;
}

export function marquee(text, o = {}) {
  const len = String(text).length;
  const d = Math.max(6, Math.min(30, len * 0.18)) / (o.speed || 1);
  return `<div class="mq${o.cls ? ' ' + o.cls : ''}"><span style="animation-duration:${d.toFixed(1)}s">${esc(text)}</span></div>`;
}

export const blink = (text) => `<span class="blink">${esc(text)}</span>`;
export const newBadge = () => '<span class="newb">NEW!</span>';
export const hrRainbow = () => '<div class="hr-rb"></div>';

// A little construction worker and a striped barrier, drawn in SVG.
export function construction(text = 'UNDER CONSTRUCTION') {
  return `<div class="uc"><svg class="uc-man" viewBox="0 0 60 60" aria-hidden="true">
<circle cx="24" cy="12" r="6" fill="#f2c79b" stroke="#000" stroke-width="1"/>
<path d="M16 9a8 6 0 0 1 16 0z" fill="#ffd400" stroke="#000" stroke-width="1"/>
<path d="M24 18v20M24 38l-7 14M24 38l7 14" stroke="#000" stroke-width="3" fill="none" stroke-linecap="round"/>
<rect x="18" y="19" width="12" height="14" rx="2" fill="#ff7b00" stroke="#000" stroke-width="1"/>
<g class="uc-arm"><path d="M26 23l12 8" stroke="#000" stroke-width="3" stroke-linecap="round"/><path d="M38 31l10 16" stroke="#7a4a1a" stroke-width="2.5"/><path d="M44 46l9 3-3 7z" fill="#9aa"/></g>
<path d="M2 56h56" stroke="#5a3b17" stroke-width="3"/></svg>
<div class="uc-sign"><div class="uc-stripe"></div><b>${esc(text)}</b><small>Please pardon our dust!</small><div class="uc-stripe"></div></div></div>`;
}

const SKY = [['#7ec8ff', '#e8f6ff'], ['#ff9a6b', '#ffe3a1'], ['#2b2d6e', '#8a63c9'], ['#9be7a0', '#e6ffd9'], ['#ffb3de', '#fff0fa'], ['#5ed3e6', '#d6fbff'], ['#ffd25e', '#fff6cc'], ['#263238', '#546e7a']];
const BLOB = ['#ff6f61', '#6a5acd', '#2ecc71', '#f39c12', '#e84393', '#00a8ff', '#8e44ad', '#fdcb6e', '#795548', '#ffffff'];

// A tiny drawn "photo": sky, hills, sun and a creature or object.
export function scene(seed, o = {}) {
  const r = new Rng('scene:' + seed);
  const id = 's' + (hash(String(seed)) % 1e8).toString(36);
  const [a, b] = r.pick(SKY);
  const ground = r.pick(['#4caf50', '#8bc34a', '#c2b280', '#90a4ae', '#a1887f', '#26a69a']);
  const col = r.pick(BLOB);
  const sx = r.int(20, 140), sy = r.int(14, 34);
  const subj = o.subject || r.pick(['blob', 'blob', 'box', 'star', 'heart', 'cat', 'tree', 'car']);
  const x = r.int(55, 105), y = 78;
  let fig = '';
  const eyes = (cx, cy) => `<circle cx="${cx - 6}" cy="${cy}" r="3.2" fill="#fff"/><circle cx="${cx + 6}" cy="${cy}" r="3.2" fill="#fff"/><circle cx="${cx - 5.4}" cy="${cy + .6}" r="1.6"/><circle cx="${cx + 6.6}" cy="${cy + .6}" r="1.6"/>`;
  switch (subj) {
    case 'box': fig = `<rect x="${x - 16}" y="${y - 26}" width="32" height="30" fill="${col}" stroke="#0004"/>${eyes(x, y - 14)}`; break;
    case 'star': fig = `<path d="M${x} ${y - 34}l7 14 15 2-11 10 3 15-14-8-14 8 3-15-11-10 15-2z" fill="#ffd700" stroke="#c90"/>${eyes(x, y - 16)}`; break;
    case 'heart': fig = `<path d="M${x} ${y + 2}c-30-18-22-38-8-38 5 0 8 4 8 8 0-4 3-8 8-8 14 0 22 20-8 38z" fill="#ff4d88"/>`; break;
    case 'cat': fig = `<ellipse cx="${x}" cy="${y - 6}" rx="20" ry="14" fill="${col}"/><circle cx="${x + 14}" cy="${y - 22}" r="10" fill="${col}"/><path d="M${x + 6} ${y - 30}l3-9 5 7zM${x + 17} ${y - 31}l5-8 3 9z" fill="${col}"/><circle cx="${x + 11}" cy="${y - 23}" r="1.6"/><circle cx="${x + 18}" cy="${y - 23}" r="1.6"/><path d="M${x - 20} ${y - 8}q-12-4-8-18" stroke="${col}" stroke-width="4" fill="none"/>`; break;
    case 'tree': fig = `<rect x="${x - 4}" y="${y - 22}" width="8" height="26" fill="#795548"/><circle cx="${x}" cy="${y - 34}" r="18" fill="#2e7d32"/><circle cx="${x - 10}" cy="${y - 26}" r="10" fill="#388e3c"/>`; break;
    case 'car': fig = `<rect x="${x - 24}" y="${y - 18}" width="48" height="14" rx="4" fill="${col}"/><rect x="${x - 14}" y="${y - 28}" width="26" height="12" rx="4" fill="${col}"/><rect x="${x - 10}" y="${y - 26}" width="18" height="8" fill="#bde"/><circle cx="${x - 13}" cy="${y - 3}" r="6" fill="#222"/><circle cx="${x + 13}" cy="${y - 3}" r="6" fill="#222"/>`; break;
    default: fig = `<path d="M${x - 20} ${y + 2}c0-30 8-38 20-38s20 8 20 38z" fill="${col}" stroke="#0003"/>${eyes(x, y - 20)}<path d="M${x - 6} ${y - 10}q6 6 12 0" stroke="#000" stroke-width="1.6" fill="none"/>`;
  }
  const night = a === '#2b2d6e' || a === '#263238';
  const sun = night ? `<circle cx="${sx}" cy="${sy}" r="9" fill="#fffbe0"/><circle cx="${sx + 4}" cy="${sy - 3}" r="8" fill="${a}"/>` : `<circle cx="${sx}" cy="${sy}" r="10" fill="#fff59d"/>`;
  const caption = o.caption ? `<text x="80" y="114" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="13" fill="#fff" stroke="#000" stroke-width="2.5" paint-order="stroke">${esc(String(o.caption).slice(0, 26).toUpperCase())}</text>` : '';
  return `<svg class="scene" viewBox="0 0 160 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="160" height="120" fill="url(#${id})"/>${sun}<path d="M0 ${r.int(80, 92)}q40-${r.int(10, 26)} 80 0t80 0V120H0z" fill="${ground}"/>${fig}${caption}</svg>`;
}

// A "photo" that loads slowly line by line, like 2012 on a bad connection.
export function pic(seed, o = {}) {
  return `<div class="pic${o.cls ? ' ' + o.cls : ''}">${scene(seed, o)}${o.label ? `<span class="pic-l">${esc(o.label)}</span>` : ''}</div>`;
}

const SKIN = ['#f2c79b', '#e0ac69', '#c68642', '#8d5524', '#ffdbac', '#a8e6cf', '#b39ddb', '#90caf9'];
// Cartoon avatar, drawn from a username.
export function avatar(name, size = 48) {
  const r = new Rng('av:' + name);
  const bg = r.pick(['#dfe8f5', '#ffe0e9', '#e3f6dd', '#fff3c4', '#e8e0ff', '#d9f4f6', '#333', '#ffd6a5']);
  const skin = r.pick(SKIN);
  const hair = r.pick(['#3b2a1a', '#f4d03f', '#c0392b', '#111', '#8e44ad', '#2980b9', '#e67e22', '#fff']);
  const style = r.int(0, 5);
  const hairPath = [
    `<path d="M14 26c0-12 8-18 18-18s18 6 18 18c-4-6-10-8-18-8s-14 2-18 8z" fill="${hair}"/>`,
    `<path d="M12 30c0-16 10-22 20-22s20 6 20 22l-4-4-4 3-4-4-4 3-4-4-4 3-4-4-4 3z" fill="${hair}"/>`,
    `<rect x="16" y="6" width="32" height="12" rx="3" fill="${hair}"/><rect x="10" y="16" width="44" height="4" rx="2" fill="${hair}"/>`,
    `<path d="M20 12l4-8 4 8 4-8 4 8 4-8 4 8z" fill="${hair}"/>`,
    `<circle cx="32" cy="12" r="7" fill="${hair}"/>`,
    '',
  ][style];
  const eyes = r.pick([
    '<circle cx="25" cy="32" r="2.6"/><circle cx="39" cy="32" r="2.6"/>',
    '<rect x="20" y="29" width="10" height="6" rx="1"/><rect x="34" y="29" width="10" height="6" rx="1"/><path d="M30 31h4" stroke="#000" stroke-width="1.5"/>',
    '<path d="M22 32q3-3 6 0M36 32q3-3 6 0" stroke="#000" stroke-width="2" fill="none"/>',
    '<circle cx="25" cy="32" r="4" fill="#fff" stroke="#000"/><circle cx="39" cy="32" r="4" fill="#fff" stroke="#000"/><circle cx="26" cy="33" r="1.8"/><circle cx="40" cy="33" r="1.8"/>',
  ]);
  const mouth = r.pick([
    '<path d="M25 42q7 6 14 0" stroke="#000" stroke-width="2" fill="none"/>',
    '<path d="M26 43h12" stroke="#000" stroke-width="2"/>',
    '<ellipse cx="32" cy="43" rx="4" ry="3"/>',
    '<path d="M24 41q8 8 16 0z" fill="#fff" stroke="#000" stroke-width="1.4"/>',
    '<path d="M26 44q6-4 12 0" stroke="#000" stroke-width="2" fill="none"/>',
  ]);
  return `<svg class="av" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="${bg}"/><path d="M8 64c2-12 12-16 24-16s22 4 24 16z" fill="${r.pick(BLOB)}"/><circle cx="32" cy="32" r="18" fill="${skin}"/>${hairPath}${eyes}${mouth}</svg>`;
}

export function stars(n, max = 5) {
  const k = Math.max(0, Math.min(max, Math.round(n)));
  return `<span class="stars">${'&#9733;'.repeat(k)}<span class="off">${'&#9733;'.repeat(max - k)}</span></span>`;
}

// Animated banner ad for a made-up product.
export function banner(r, product, line) {
  const style = r.int(0, 3);
  return `<div class="ad-468 ad-s${style}" data-act="ad" data-product="${esc(product)}"><span class="ad-tag">Advertisement</span><b>${esc(product)}</b><span class="ad-line">${esc(line)}</span><span class="ad-cta">CLICK HERE!</span></div>`;
}

// 88x31 buttons, the badges of honor of 2012 homepages.
const BADGES = [
  ['NetSkipper', 'NOW!', '#1d3f72', '#ffe26a'], ['Made with', 'NOTEPAD', '#fff', '#000'], ['Powered by', 'HAMSTERS', '#c33', '#fff'],
  ['Free Hosting', 'BubbleHost', '#2a9d8f', '#fff'], ['Valid', 'HTML 3.2*', '#666', '#ff0'], ['Best viewed', '800x600', '#000', '#0f0'],
  ['Get', 'Searchasaurus', '#43a047', '#fff'], ['I <3', 'THE WEB', '#e91e63', '#fff'], ['Anti-', 'BOREDOM', '#7b1fa2', '#fff'], ['Y2K', 'COMPLIANT', '#0d47a1', '#fff'],
];
export function badges(r, n = 4) {
  return `<div class="badges">${r.sample(BADGES, n).map(([a, b, bg, fg]) => `<span class="b88" style="background:${bg};color:${fg}"><small>${esc(a)}</small><b>${esc(b)}</b></span>`).join('')}</div>`;
}
