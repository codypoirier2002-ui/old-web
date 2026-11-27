// Each site gets a look decided by its address, so it is the same every visit.
import { Rng } from '../core/rng.js';

const FAN = [
  { bg: '#000', fg: '#fff', link: '#ffff00', acc: '#ff00ff', h: '#00ffff', pat: 'stars' },
  { bg: '#ffccff', fg: '#660066', link: '#ff0066', acc: '#9900cc', h: '#ff00ff', pat: 'hearts' },
  { bg: '#000033', fg: '#99ffff', link: '#ff99ff', acc: '#ffff66', h: '#ff66cc', pat: 'stars' },
  { bg: '#ccffff', fg: '#003366', link: '#0000ff', acc: '#ff6600', h: '#0066cc', pat: 'bubbles' },
  { bg: '#330033', fg: '#ffccff', link: '#66ffcc', acc: '#ffcc00', h: '#ff99ff', pat: 'sparkle' },
  { bg: '#ffff99', fg: '#663300', link: '#cc0000', acc: '#009900', h: '#ff3300', pat: 'checker' },
  { bg: '#003300', fg: '#ccffcc', link: '#ffff00', acc: '#ff9900', h: '#66ff66', pat: 'dots' },
  { bg: '#1a0033', fg: '#e0ccff', link: '#00ffcc', acc: '#ff3399', h: '#cc99ff', pat: 'sparkle' },
  { bg: '#ffe6f2', fg: '#4d0026', link: '#cc0066', acc: '#6600cc', h: '#ff3399', pat: 'hearts' },
  { bg: '#e6f0ff', fg: '#000066', link: '#cc00cc', acc: '#ff0000', h: '#3333ff', pat: 'clouds' },
];
const FAN_FONT = ['"Comic Sans MS", "Chalkboard SE", "Comic Neue", cursive', '"Times New Roman", Times, serif', 'Verdana, Geneva, sans-serif', '"Trebuchet MS", Arial, sans-serif', '"Comic Sans MS", "Chalkboard SE", cursive'];

const FORUM = [
  { h1: '#0b4f8a', h2: '#1c6fb8', row: '#eef4fb', row2: '#dde8f5', line: '#9db8d6', link: '#0b4f8a' },
  { h1: '#2f5f1f', h2: '#4a8a2f', row: '#f2f8ee', row2: '#e2eedb', line: '#a9c79a', link: '#2f6f1f' },
  { h1: '#4b2a7a', h2: '#6b3fa8', row: '#f5f0fb', row2: '#e8def6', line: '#bba7d8', link: '#5a2d99' },
  { h1: '#222', h2: '#444', row: '#f4f4f4', row2: '#e6e6e6', line: '#aaa', link: '#a33' },
  { h1: '#8a3b0b', h2: '#c25a14', row: '#fdf5ee', row2: '#f6e5d6', line: '#ddb391', link: '#9a4210' },
  { h1: '#0e5d5d', h2: '#178585', row: '#eef8f8', row2: '#dbeeee', line: '#94c6c6', link: '#0e6d6d' },
];

const BLOG = [
  { bg: '#f2f2f2', card: '#fff', fg: '#333', link: '#2a6ebb', h: '#e67e22', head: '#2c3e50', headfg: '#fff' },
  { bg: '#1e1e1e', card: '#2b2b2b', fg: '#ddd', link: '#7fc8ff', h: '#ffcc66', head: '#111', headfg: '#ffcc66' },
  { bg: '#ffe9f3', card: '#fff', fg: '#553344', link: '#d6336c', h: '#d6336c', head: '#ff8fb8', headfg: '#fff' },
  { bg: '#e8f4e4', card: '#fffdf6', fg: '#334', link: '#3a7d44', h: '#3a7d44', head: '#5c9e5a', headfg: '#fff' },
  { bg: '#dbe9f6', card: '#fff', fg: '#223', link: '#1d5fa8', h: '#1d5fa8', head: 'linear-gradient(#4a90d9,#2a6cb8)', headfg: '#fff' },
  { bg: '#f5ecd7', card: '#fffaf0', fg: '#4a3b2a', link: '#a0522d', h: '#8b4513', head: '#8b5a2b', headfg: '#fff8e7' },
];

const CLAN = [
  { neon: '#39ff14', neon2: '#00b300' },
  { neon: '#ff2d2d', neon2: '#a00000' },
  { neon: '#00e5ff', neon2: '#0077aa' },
  { neon: '#c94bff', neon2: '#6a00b3' },
  { neon: '#ff9f1a', neon2: '#b35900' },
  { neon: '#ffe600', neon2: '#a39300' },
];

export function theme(site) {
  const r = new Rng('theme:' + (site ? site.key : 'none'));
  const kind = site ? site.kind : '';
  if (kind === 'fan') return { ...r.pick(FAN), font: r.pick(FAN_FONT), hfont: r.pick(['Impact, "Arial Black", sans-serif', '"Comic Sans MS", "Chalkboard SE", cursive', 'Georgia, serif', '"Trebuchet MS", sans-serif']) };
  if (kind === 'forum') return r.pick(FORUM);
  if (kind === 'blog') return r.pick(BLOG);
  if (kind === 'clan' || kind === 'trickshot') return r.pick(CLAN);
  return {};
}

export function vars(obj) {
  return Object.entries(obj).filter(([k]) => k !== 'pat' && k !== 'font' && k !== 'hfont').map(([k, v]) => `--${k}:${v}`).join(';') +
    (obj.font ? `;--font:${obj.font.replace(/"/g, "'")}` : '') + (obj.hfont ? `;--hfont:${obj.hfont.replace(/"/g, "'")}` : '');
}
