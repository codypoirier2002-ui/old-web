// Menus and panels: history, bookmarks, settings, address bar suggestions.
import { kv, pages } from './storage.js';
import { ICON, favicon } from './icons.js';
import { SPEEDS, DEFAULT_BOOKMARKS } from './browser.js';
import { shortUrl, fromInput } from '../core/url.js';
import { forgetSites } from '../core/site.js';
import { esc, fmtTime, MONTHS } from '../core/util.js';
import { ai } from '../ai/client.js';

const HISTORY_MAX = 500;

export function recordVisit(page) {
  const h = kv.get('history', []);
  const now = Date.now();
  if (h.length && h[0].url === page.url) h[0].t = now;
  else h.unshift({ url: page.url, title: (page.title || shortUrl(page.url)).slice(0, 90), t: now });
  if (h.length > HISTORY_MAX) h.length = HISTORY_MAX;
  kv.set('history', h);
}

function close(b) {
  b.root.querySelectorAll('.drop, .sheet').forEach((x) => x.remove());
  document.removeEventListener('pointerdown', b._dropAway, true);
}

function sheet(b, title, bodyHtml, footHtml = '') {
  close(b);
  const s = document.createElement('div');
  s.className = 'sheet';
  s.innerHTML = `<div class="sheet-h"><span class="grow">${title}</span>${footHtml}<button class="tb sm" data-x aria-label="Close">${ICON.close}</button></div><div class="sheet-b">${bodyHtml}</div>`;
  s.querySelector('[data-x]').addEventListener('click', () => { b.sound('click'); s.remove(); });
  b.el.vwrap.appendChild(s);
  return s;
}

function dayLabel(t) {
  const d = new Date(t);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return 'Earlier this week';
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function openHistory(b, filter = '') {
  const all = kv.get('history', []);
  const f = filter.trim().toLowerCase();
  const list = f ? all.filter((x) => x.title.toLowerCase().includes(f) || x.url.includes(f)) : all;
  let html = `<div class="row-search"><input type="search" placeholder="Search history" value="${esc(filter)}" data-hs autocomplete="off"></div>`;
  if (!list.length) html += `<div class="empty">${all.length ? 'Nothing matches.' : 'No history yet. Go explore!'}</div>`;
  let group = '';
  for (const it of list.slice(0, 300)) {
    const g = dayLabel(it.t);
    if (g !== group) { group = g; html += `<div class="grp">${esc(g)}</div>`; }
    html += `<div class="row" data-url="${esc(it.url)}">${favicon(it.url)}<span class="t"><b>${esc(it.title)}</b><small>${esc(shortUrl(it.url))} &middot; ${fmtTime(new Date(it.t))}</small></span><button class="x-del" data-del="${esc(it.url)}" data-t="${it.t}" aria-label="Remove">&times;</button></div>`;
  }
  const s = sheet(b, `${ICON.clock} History`, html, '<button class="btn-ui" data-clear>Clear History</button>');
  s.addEventListener('click', async (e) => {
    const del = e.target.closest('[data-del]');
    if (del) {
      kv.set('history', kv.get('history', []).filter((x) => !(x.url === del.dataset.del && String(x.t) === del.dataset.t)));
      del.closest('.row').remove();
      return;
    }
    if (e.target.closest('[data-clear]')) {
      const ok = await b.alert('Clear your entire browsing history?', 'Clear History', ['Clear', 'Cancel']);
      if (ok === 0) { kv.set('history', []); openHistory(b); }
      return;
    }
    const row = e.target.closest('.row[data-url]');
    if (row) { s.remove(); b.sound('click'); b.go(row.dataset.url); }
  });
  const inp = s.querySelector('[data-hs]');
  inp.addEventListener('input', () => {
    const v = inp.value;
    clearTimeout(inp._t);
    inp._t = setTimeout(() => { openHistory(b, v); const n = b.root.querySelector('[data-hs]'); if (n) { n.focus(); n.setSelectionRange(v.length, v.length); } }, 200);
  });
}

export function openBookmarks(b) {
  const rows = b.bookmarks.map((bm, i) => `<div class="row" data-url="${esc(bm.url)}">${favicon(bm.url)}<span class="t"><b>${esc(bm.title)}</b><small>${esc(shortUrl(bm.url))}</small></span>${i > 0 ? `<button class="x-del up" data-up="${i}" aria-label="Move up">&#9650;</button>` : ''}<button class="x-del" data-del="${i}" aria-label="Delete">&times;</button></div>`).join('');
  const cur = b.current;
  const s = sheet(b, `${ICON.star} Bookmarks`, (rows || '<div class="empty">No bookmarks. Tap the star to add one!</div>') + '<div class="sheet-note">Tip: tap the star in the toolbar to bookmark the page you are on.</div>', `${cur ? '<button class="btn-ui" data-add>Add This Page</button>' : ''}<button class="btn-ui" data-reset>Reset</button>`);
  s.addEventListener('click', async (e) => {
    const t = e.target;
    if (t.closest('[data-del]')) { b.bookmarks.splice(+t.closest('[data-del]').dataset.del, 1); b.saveBookmarks(); openBookmarks(b); return; }
    if (t.closest('[data-up]')) { const i = +t.closest('[data-up]').dataset.up; const [x] = b.bookmarks.splice(i, 1); b.bookmarks.splice(i - 1, 0, x); b.saveBookmarks(); openBookmarks(b); return; }
    if (t.closest('[data-add]')) { if (!b.bookmarks.some((x) => x.url === cur.url)) { b.bookmarks.push({ url: cur.url, title: (cur.title || shortUrl(cur.url)).slice(0, 60) }); b.saveBookmarks(); } openBookmarks(b); return; }
    if (t.closest('[data-reset]')) {
      const ok = await b.alert('Put the bookmarks back to how they came?', 'Bookmarks', ['Reset', 'Cancel']);
      if (ok === 0) { b.bookmarks = DEFAULT_BOOKMARKS.slice(); b.saveBookmarks(); openBookmarks(b); }
      return;
    }
    const row = t.closest('.row[data-url]');
    if (row) { s.remove(); b.sound('click'); b.go(row.dataset.url); }
  });
}

function aiLabel() {
  const st = ai.status || {};
  if (st.reason === 'static') return 'AI writer: off on this site (built-in pages)';
  if (st.reason === 'no-server' || st.reason === 'checking') return 'AI writer: off (no local server)';
  if (st.reason === 'no-key') return 'AI writer: off (no API key)';
  if (st.reason === 'bad-key') return 'AI writer: off (key rejected)';
  if (st.reason === 'cap') return `AI writer: daily limit reached (${st.used}/${st.cap})`;
  return null;
}

export function openMenu(b) {
  if (b.root.querySelector('.drop')) { close(b); return; }
  close(b);
  const s = b.settings;
  const al = aiLabel();
  const aiRow = al ? `<div class="sub">${esc(al)}</div>` : `<button data-m="ai">AI writer: ${s.ai === false ? 'Off' : 'On'} <small>(${ai.status.used}/${ai.status.cap} today)</small></button>`;
  const d = document.createElement('div');
  d.className = 'drop';
  d.innerHTML = `
    <button data-m="home">${ICON.home} Home</button>
    <button data-m="bookmarks">${ICON.star} Bookmarks</button>
    <button data-m="history">${ICON.clock} History</button>
    <hr>
    <button data-m="speed">Connection: <b>${SPEEDS[s.speed]?.label || 'DSL'}</b></button>
    <button data-m="sound">Sound: <b>${s.sound ? 'On' : 'Off'}</b></button>
    <button data-m="popups">Pop-up blocker: <b>${s.popups === 'block' ? 'On' : 'Off'}</b></button>
    <button data-m="boot">Startup screen: <b>${{ full: 'Full', quick: 'Quick', off: 'Off' }[s.boot] || 'Auto'}</b></button>
    ${aiRow}
    <hr>
    <button data-m="about">About NetSkipper</button>
    <button data-m="clear">Clear all saved data...</button>`;
  b.el.win.appendChild(d);
  const rect = b.el.menu.getBoundingClientRect();
  const wr = b.el.win.getBoundingClientRect();
  d.style.top = Math.round(rect.bottom - wr.top + 4) + 'px';
  b._dropAway = (e) => { if (!d.contains(e.target) && !b.el.menu.contains(e.target)) close(b); };
  document.addEventListener('pointerdown', b._dropAway, true);
  d.addEventListener('click', async (e) => {
    const m = e.target.closest('[data-m]');
    if (!m) return;
    b.sound('click');
    const k = m.dataset.m;
    if (k === 'home') { close(b); b.home(); }
    else if (k === 'bookmarks') openBookmarks(b);
    else if (k === 'history') openHistory(b);
    else if (k === 'about') { close(b); b.go('about:netskipper'); }
    else if (k === 'speed') { const ks = Object.keys(SPEEDS); s.speed = ks[(ks.indexOf(s.speed) + 1) % ks.length]; b.saveSettings(); reopen(); }
    else if (k === 'sound') { s.sound = !s.sound; b.saveSettings(); b.svc.onSound?.(s.sound); reopen(); }
    else if (k === 'popups') { s.popups = s.popups === 'block' ? 'allow' : 'block'; b.saveSettings(); reopen(); }
    else if (k === 'boot') { s.boot = { full: 'quick', quick: 'off', off: 'full' }[s.boot] || 'full'; b.saveSettings(); reopen(); }
    else if (k === 'ai') { s.ai = s.ai === false; b.saveSettings(); reopen(); }
    else if (k === 'clear') {
      close(b);
      const ok = await b.alert('Erase all bookmarks, history, saved pages, guestbook entries and high scores? The web will forget you were here.', 'Clear All Data', ['Erase Everything', 'Cancel']);
      if (ok === 0) {
        kv.clearAll();
        forgetSites();
        await pages.clear();
        location.reload();
      }
    }
  });
  function reopen() { close(b); openMenu(b); }
}

// ---- address bar suggestions ----
export function closeSuggest(b) {
  b.root.querySelectorAll('.suggest').forEach((x) => x.remove());
}
export function suggest(b, text) {
  closeSuggest(b);
  const q = String(text || '').trim().toLowerCase();
  if (q.length < 1) return;
  const seen = new Set();
  const items = [];
  for (const x of [...b.bookmarks, ...kv.get('history', [])]) {
    if (items.length >= 6) break;
    if (seen.has(x.url)) continue;
    if (x.url.toLowerCase().includes(q) || (x.title || '').toLowerCase().includes(q)) { seen.add(x.url); items.push(x); }
  }
  const target = fromInput(text);
  const isSearch = target && target.includes('searchasaurus.com/search?q=');
  const box = document.createElement('div');
  box.className = 'suggest';
  box.innerHTML = `<div data-url="${esc(target || '')}">${isSearch ? `Search Searchasaurus for <b>${esc(text.trim())}</b>` : `Go to <b>${esc(shortUrl(target || text))}</b>`}</div>` + items.map((x) => `<div data-url="${esc(x.url)}">${esc(x.title || shortUrl(x.url))}<small>${esc(shortUrl(x.url))}</small></div>`).join('');
  const rect = b.el.form.getBoundingClientRect();
  const wr = b.el.win.getBoundingClientRect();
  box.style.top = Math.round(rect.bottom - wr.top + 2) + 'px';
  box.addEventListener('pointerdown', (e) => {
    const it = e.target.closest('[data-url]');
    if (!it || !it.dataset.url) return;
    e.preventDefault();
    closeSuggest(b);
    b.el.addr.blur();
    b.go(it.dataset.url);
  });
  b.el.win.appendChild(box);
}

