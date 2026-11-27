const s = (body, extra = '') => `<svg viewBox="0 0 24 24" aria-hidden="true" ${extra}>${body}</svg>`;
const st = 'fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';

export const ICON = {
  back: s(`<path d="M14.5 5 7.5 12l7 7" ${st}/>`),
  fwd: s(`<path d="M9.5 5l7 7-7 7" ${st}/>`),
  reload: s(`<path d="M18.5 12.5a6.5 6.5 0 1 1-2-5" ${st} stroke-width="2.6"/><path d="M18.5 3.5v5h-5" ${st} stroke-width="2.6"/>`),
  stop: s(`<path d="M6.5 6.5l11 11M17.5 6.5l-11 11" ${st}/>`),
  home: s(`<path d="M3.5 11.5 12 4l8.5 7.5" ${st} stroke-width="2.5"/><path d="M6.5 10v9.5h4v-5h3v5h4V10" fill="currentColor"/>`),
  star: s(`<path d="M12 2.8l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 17l-5.8 3.3 1.4-6.4L2.7 9.5l6.5-.7z" fill="currentColor" stroke="#7a5a00" stroke-width=".8" stroke-linejoin="round"/>`),
  starO: s(`<path d="M12 2.8l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 17l-5.8 3.3 1.4-6.4L2.7 9.5l6.5-.7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>`),
  menu: s(`<path d="M4 6.5h16M4 12h16M4 17.5h16" ${st} stroke-width="2.6"/>`),
  go: s(`<path d="M4 12h13M12 6l6 6-6 6" ${st} stroke-width="2.8"/>`),
  clock: s(`<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 7v5.5l3.5 2" ${st} stroke-width="2.2"/>`),
  close: s(`<path d="M6.5 6.5l11 11M17.5 6.5l-11 11" ${st} stroke-width="2.6"/>`),
};

// Coloured square "favicon" from a host name.
import { hash } from '../core/rng.js';
import { esc } from '../core/util.js';
const FAV_COLORS = ['#d23c3c', '#2f7ad6', '#2e9b48', '#e08a12', '#8a3fd1', '#d13f9b', '#1d9aa1', '#6b6b6b', '#b8860b', '#3f51b5'];
export function favicon(url) {
  const host = String(url).replace(/^https?:\/\//, '').split('/')[0] || 'about';
  const core = host.replace(/^www\./, '').replace(/^members\./, '');
  const letter = url.startsWith('about:') ? 'i' : (core[0] || '?').toUpperCase();
  const c = FAV_COLORS[hash(core) % FAV_COLORS.length];
  return `<span class="fav" style="background:${c}">${esc(letter)}</span>`;
}
