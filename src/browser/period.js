// Period details added to every page after it renders: hit counters that
// count your visits, music players (silent until tapped), clickable ads,
// pop-up windows, status-bar scrollers and cursor sparkles.
import { kv } from './storage.js';
import { playSong, stopSong } from './audio.js';
import { Rng } from '../core/rng.js';
import { esc } from '../core/util.js';
import { page as P } from '../core/links.js';
import { productName, miniGameName } from '../core/names.js';
import { LEX } from '../core/lex.js';
import { scene } from '../render/widgets.js';
import { searchEggs } from './eggs.js';

const NO_POP = new Set(['about', 'notFound', 'noServer', 'product', 'game', 'chatRoom', 'searchHome']);

// ---- hit counters ----
function visits(url) {
  const v = kv.get('visits', {});
  v[url] = (v[url] || 0) + 1;
  const keys = Object.keys(v);
  if (keys.length > 2500) delete v[keys[0]];
  kv.set('visits', v);
  return v[url];
}
function setCounter(el, n) {
  const digits = String(Math.max(0, Math.floor(n))).padStart(6, '0');
  el.innerHTML = [...digits].map((d, i) => `<i style="animation-delay:${i * 60}ms">${d}</i>`).join('');
  el.classList.add('roll');
}

// ---- music players ----
const SPEAKER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path class="mp-x" d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2"/><path class="mp-w" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
function musicPlayer(el, api, onLeave) {
  const [title, artist] = (el.dataset.song || 'Untitled|Unknown').split('|');
  const skin = new Rng('skin:' + title).int(0, 3);
  el.innerHTML = `<div class="mp mp-s${skin}"><div class="mp-row"><button class="mp-btn" aria-label="Play music">&#9654;</button><div class="mp-info"><div class="mp-title"><span>${esc(artist)} - ${esc(title)}</span></div><div class="mp-eq">${'<i></i>'.repeat(10)}</div></div><span class="mp-vol">${SPEAKER}</span></div><div class="mp-hint">Music is off. Tap &#9654; to play</div></div>`;
  const box = el.querySelector('.mp');
  const btn = el.querySelector('.mp-btn');
  const bars = [...el.querySelectorAll('.mp-eq i')];
  let song = null;
  const stop = () => {
    if (song) { song.stop(); song = null; }
    box.classList.remove('on');
    btn.innerHTML = '&#9654;';
    el.querySelector('.mp-hint').innerHTML = 'Music is off. Tap &#9654; to play';
  };
  btn.addEventListener('click', () => {
    if (song) { stop(); return; }
    if (!api.settings().sound) { api.toast('Sound is turned off. Turn it on in the menu.'); return; }
    document.querySelectorAll('.mp.on').forEach((m) => m.querySelector('.mp-btn').click());
    song = playSong(title + artist, () => bars.forEach((b) => { b.style.transform = `scaleY(${(0.2 + Math.random() * 0.8).toFixed(2)})`; }));
    if (!song) { api.toast('Your browser cannot play music. Imagine a catchy tune!'); return; }
    box.classList.add('on');
    btn.innerHTML = '&#10074;&#10074;';
    el.querySelector('.mp-hint').textContent = 'Now playing...';
  });
  onLeave(stop);
}

// ---- pop-up windows ----
const POP_KINDS = ['product', 'product', 'product', 'game', 'chat', 'smileys'];
export function popup(api, r, kind = r.pick(POP_KINDS)) {
  const overlay = api.overlay;
  if (overlay.querySelector('.popwin')) return;
  const product = productName(r);
  let title, body, go, cta, t;
  if (kind === 'prize') {
    title = 'CONGRATULATIONS!!!'; t = 'Totally Real Prizes'; go = 'http://www.totallyrealprizes.biz/'; cta = 'CLAIM MY PRIZE';
    body = `<b class="pw-big">You are the 1,000,000th visitor!!!</b><p>Click below to claim your FREE prize! This is not a joke!!!</p>`;
  } else if (kind === 'game') {
    const g = miniGameName(r);
    title = 'FREE GAME!!!'; t = g; go = P.game(g); cta = 'PLAY NOW';
    body = `<b class="pw-big">${esc(g)}</b><p>The most addictive game on the internet! 100% FREE! No download!</p>`;
  } else if (kind === 'chat') {
    title = 'Chatterbox'; t = 'The Lobby'; go = P.room('The Lobby'); cta = 'CHAT NOW';
    body = `<b class="pw-big">${r.int(800, 4000)} people are chatting right now!</b><p>Come say hi. Bring snacks.</p>`;
  } else if (kind === 'smileys') {
    const p = 'MegaSmileys 2000';
    title = 'Free Smileys!'; t = p; go = P.product(p); cta = 'DOWNLOAD FREE';
    body = `<b class="pw-big">10,000 FREE smileys for your email!</b><p class="pw-sm">:) :D ;) :P XD ^_^ &lt;3 B) o_O :3</p>`;
  } else {
    title = `${product} - Special Offer!!!`; t = product; go = P.product(product); cta = 'ORDER NOW';
    body = `<div class="pw-img">${scene(product, { subject: r.pick(['box', 'star', 'heart']) })}</div><b class="pw-big">${esc(product)}</b><p>${esc(r.pick([`Only $${r.int(9, 39)}.95!!! Limited time only!`, 'As seen on TV! Order in the next 10 minutes!', 'Doctors are confused by it!', `Rated #1 by ${r.int(3, 9)} out of 10 ${r.pick(LEX.animal)}s!`]))}</p>`;
  }
  const w = document.createElement('div');
  w.className = 'popwin';
  const vw = overlay.clientWidth || 360;
  const vh = overlay.clientHeight || 600;
  const pw = Math.min(300, vw - 24);
  w.style.width = pw + 'px';
  w.style.left = Math.round(Math.random() * Math.max(0, vw - pw - 12) + 6) + 'px';
  w.style.top = Math.round(Math.random() * Math.max(0, vh * 0.45) + 10) + 'px';
  w.innerHTML = `<div class="pw-t"><span>${esc(title)}</span><button class="pw-x" aria-label="Close">&#10005;</button></div><div class="pw-b">${body}<button class="gl orange pw-go">${esc(cta)}</button><a class="pw-no">No thanks</a></div>`;
  overlay.appendChild(w);
  api.sound('ding');
  const close = () => { w.remove(); api.sound('click'); };
  w.querySelector('.pw-x').addEventListener('click', close);
  w.querySelector('.pw-no').addEventListener('click', close);
  w.querySelector('.pw-go').addEventListener('click', () => { w.remove(); api.go(go, { t, site: t, kind: kind === 'game' ? 'games' : kind === 'chat' ? 'chat' : 'shop' }); });
  // drag by the title bar
  const bar = w.querySelector('.pw-t');
  let sx, sy, ox, oy;
  bar.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.pw-x')) return;
    sx = e.clientX; sy = e.clientY; ox = w.offsetLeft; oy = w.offsetTop;
    bar.setPointerCapture(e.pointerId);
  });
  bar.addEventListener('pointermove', (e) => {
    if (sx == null) return;
    w.style.left = Math.max(-pw + 60, Math.min(vw - 40, ox + e.clientX - sx)) + 'px';
    w.style.top = Math.max(0, Math.min(vh - 40, oy + e.clientY - sy)) + 'px';
  });
  bar.addEventListener('pointerup', () => { sx = null; });
}

function maybePopup(page, api, later) {
  if (NO_POP.has(page.type)) return;
  const s = api.settings();
  const n = kv.get('popCount', 0) + 1;
  kv.set('popCount', n);
  const last = kv.get('popLast', 0);
  if (n - last < 4 || Math.random() > 0.4) return;
  kv.set('popLast', n);
  const r = new Rng(page.url + n);
  later(() => {
    if (s.popups === 'block') {
      const bar = document.createElement('div');
      bar.className = 'infobar';
      bar.innerHTML = '<span>&#9888; NetSkipper prevented this site from opening a pop-up window. <u>Click here to show it.</u></span><button aria-label="Close">&#10005;</button>';
      bar.addEventListener('click', (e) => { bar.remove(); if (!e.target.closest('button')) popup(api, r); });
      api.overlay.appendChild(bar);
      api.sound('pop');
    } else popup(api, r, !kv.get('petrock', null) && r.chance(0.18) ? 'prize' : undefined);
  }, 1500 + r.int(0, 2500));
}

// ---- status bar scroller ----
function scroller(api, msg, later) {
  let s = msg + '     ';
  let stopped = false;
  const step = () => {
    if (stopped) return;
    const b = api.browser;
    if (!b.loading && b.el.msg.textContent !== 'Done' && !b.el.msg.dataset.sc) { later(step, 2000); return; }
    s = s.slice(1) + s[0];
    b.el.msg.textContent = s;
    b.el.msg.dataset.sc = '1';
    later(step, 140);
  };
  later(step, 1500);
  return () => { stopped = true; delete api.browser.el.msg.dataset.sc; };
}

// ---- sparkle cursor trail (mouse only) ----
function trail(el, later) {
  if (!window.matchMedia || !window.matchMedia('(pointer: fine)').matches) return () => {};
  let last = 0;
  const move = (e) => {
    const now = performance.now();
    if (now - last < 45) return;
    last = now;
    const s = document.createElement('i');
    s.className = 'trail';
    const rect = el.getBoundingClientRect();
    s.style.left = e.clientX - rect.left + 'px';
    s.style.top = e.clientY - rect.top + 'px';
    el.appendChild(s);
    later(() => s.remove(), 700);
  };
  el.addEventListener('mousemove', move);
  return () => el.removeEventListener('mousemove', move);
}

export function decorate(pe, page, ctx, api) {
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
  const cleanups = [() => timers.forEach(clearTimeout)];
  const onLeave = (fn) => cleanups.push(fn);
  const root = pe.firstElementChild || pe;
  const v = visits(page.url);

  root.querySelectorAll('.ctr[data-n]').forEach((c) => setCounter(c, +c.dataset.n + v));
  root.querySelectorAll('[data-song]').forEach((el) => musicPlayer(el, api, onLeave));
  root.addEventListener('click', (e) => {
    const ad = e.target.closest('[data-act="ad"], [data-act="adlink"]');
    if (ad && ad.dataset.product) { api.sound('click'); api.go(P.product(ad.dataset.product), { t: ad.dataset.product, site: ad.dataset.product, kind: 'shop' }); }
  });

  const r = new Rng(page.url + ':period');
  if ((page.type === 'fan' || page.type === 'personal') && r.chance(0.45)) {
    const msg = page.type === 'fan' ? `*~*~ Welcome to my ${page.site.topic} page!!! ~*~* Sign my guestbook!!! ~*~*` : `Welcome to ${page.site.name}! Thanks for stopping by! Come back soon!`;
    cleanups.push(scroller(api, msg, later));
  }
  if (page.type === 'fan' || page.type === 'guestbook' || page.type === 'fanSub') cleanups.push(trail(root, later));
  if (page.type === 'personal' && v === 1 && r.chance(0.25)) later(() => api.alert(`Welcome to my homepage!!! You are visitor number ${(+(root.querySelector('.ctr')?.dataset.n || 1000) + 1).toLocaleString('en-US')}!`, 'Message from webpage'), 900);
  maybePopup(page, api, later);
  searchEggs(root, page, api);

  return () => { stopSong(); cleanups.forEach((f) => { try { f(); } catch { /* ignore */ } }); };
}
