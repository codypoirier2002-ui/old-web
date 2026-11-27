// Small text helpers shared by generators and renderers.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

export function slug(s, max = 60) {
  const out = String(s ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/g, '');
  return out || 'page';
}

export const squash = (s) => slug(s).replace(/-/g, '');

export function deslug(s) {
  let t = String(s ?? '');
  try { t = decodeURIComponent(t); } catch { /* keep raw */ }
  return t.replace(/\.s?html?$/i, '').replace(/[-_+]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

const SMALL = new Set(['a', 'an', 'the', 'of', 'to', 'in', 'on', 'and', 'or', 'for', 'at', 'by', 'vs', 'with', 'is']);
export function titleCase(s) {
  return String(s).split(' ').map((w, i) => (i > 0 && SMALL.has(w.toLowerCase()) ? w.toLowerCase() : cap(w))).join(' ');
}

export const fmt = (n) => Math.round(n).toLocaleString('en-US');
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const IRREGULAR = { mouse: 'mice', goose: 'geese', person: 'people', child: 'children', foot: 'feet', tooth: 'teeth', moose: 'moose', sheep: 'sheep', fish: 'fish', deer: 'deer', octopus: 'octopuses', cactus: 'cacti', knife: 'knives', loaf: 'loaves', wolf: 'wolves', elf: 'elves', shelf: 'shelves', leaf: 'leaves', potato: 'potatoes', tomato: 'tomatoes', mango: 'mangoes', hero: 'heroes', volcano: 'volcanoes' };
export function plural(w) {
  const s = String(w);
  const parts = s.split(' ');
  const last = parts.pop();
  const lower = last.toLowerCase();
  let p;
  if (IRREGULAR[lower]) p = IRREGULAR[lower];
  else if (/(s|x|z|ch|sh)$/.test(lower)) p = last + 'es';
  else if (/[^aeiou]y$/.test(lower)) p = last.slice(0, -1) + 'ies';
  else p = last + 's';
  if (last[0] && last[0] === last[0].toUpperCase() && p[0]) p = p[0].toUpperCase() + p.slice(1);
  return [...parts, p].join(' ');
}

export const article = (w) => (/^[aeiou]/i.test(String(w)) && !/^(uni|use|one|eu)/i.test(String(w)) ? 'an ' : 'a ') + w;

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// The fake internet always lives in 2012, on today's month and day.
export const YEAR = 2012;
export function fakeToday() {
  const d = new Date();
  return new Date(YEAR, d.getMonth(), d.getDate(), d.getHours(), d.getMinutes());
}
export function daysAgo(n) {
  const d = fakeToday();
  d.setDate(d.getDate() - n);
  if (d.getFullYear() !== YEAR) d.setFullYear(YEAR);
  return d;
}
export const fmtDate = (d) => `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
export const fmtShort = (d) => `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`;
export function fmtTime(d) {
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
}
export function ago(mins) {
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.floor(h / 24);
  if (d < 31) return `${d} day${d === 1 ? '' : 's'} ago`;
  const mo = Math.floor(d / 30);
  return `${mo} month${mo === 1 ? '' : 's'} ago`;
}

export function duration(sec) {
  const m = Math.floor(sec / 60);
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}
