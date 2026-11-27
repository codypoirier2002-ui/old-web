// NetSkipper: the fake browser. Address bar, back/forward, bookmarks bar,
// slow loading bar, status bar, and the page area.
import { ICON, favicon } from './icons.js';
import { kv, pages } from './storage.js';
import { fromInput, canon, parse, HOME, shortUrl, HOSTS } from '../core/url.js';
import { generate, render as renderPage, GEN_VERSION } from '../pages/index.js';
import { esc } from '../core/util.js';

export const SPEEDS = {
  dialup: { label: 'Dial-up (56k)', lookup: 700, transfer: 1900, jitter: 1200, reveal: 85 },
  dsl: { label: 'DSL', lookup: 260, transfer: 650, jitter: 500, reveal: 40 },
  cable: { label: 'Cable', lookup: 90, transfer: 180, jitter: 160, reveal: 12 },
};

export const DEFAULT_BOOKMARKS = [
  { url: HOME, title: 'StartBlaster!' },
  { url: `http://${HOSTS.search}/`, title: 'Searchasaurus' },
  { url: `http://${HOSTS.video}/`, title: 'Vidoodle' },
  { url: `http://${HOSTS.mail}/`, title: 'MailMole' },
  { url: `http://${HOSTS.games}/`, title: 'Arcadeville' },
  { url: `http://${HOSTS.chat}/`, title: 'Chatterbox' },
  { url: `http://${HOSTS.howto}/`, title: 'HowToTown' },
];

const $ = (root, sel) => root.querySelector(sel);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class Browser {
  constructor(root, svc = {}) {
    this.root = root;
    this.svc = svc;
    this.settings = { speed: 'dsl', sound: true, boot: 'full', ...kv.get('settings', {}) };
    this.session = kv.get('session', null) || { stack: [], idx: -1 };
    if (!Array.isArray(this.session.stack)) this.session = { stack: [], idx: -1 };
    this.bookmarks = kv.get('bookmarks', null) || DEFAULT_BOOKMARKS.slice();
    this.token = 0;
    this.current = null;
    this.cleanups = [];
    this.leaveHooks = [];
    this.build();
    this.api = this.makeApi();
  }

  // ---------------- DOM ----------------
  build() {
    this.root.innerHTML = `
<div class="win" id="win">
  <div class="titlebar"><span class="throb" id="throb" title="NetSkipper"></span><span class="tt" id="tt">NetSkipper</span>
    <div class="wbtns"><button class="wbtn" data-ui="min" aria-label="Minimize">_</button><button class="wbtn" data-ui="max" aria-label="Maximize">&#9633;</button><button class="wbtn x" data-ui="close" aria-label="Close">&#10005;</button></div></div>
  <div class="toolbar">
    <button class="tb" id="b-back" aria-label="Back" title="Back">${ICON.back}</button>
    <button class="tb" id="b-fwd" aria-label="Forward" title="Forward">${ICON.fwd}</button>
    <form class="addr" id="addr-form" autocomplete="off"><span class="fill" id="fill"></span><span id="addr-fav"></span>
      <input id="addr" type="text" inputmode="url" enterkeyhint="go" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Address" placeholder="Type an address or search">
      <button class="go" id="b-reload" type="button" aria-label="Reload" title="Reload">${ICON.reload}</button></form>
    <button class="tb sm" id="b-star" aria-label="Bookmark this page" title="Bookmark this page">${ICON.starO}</button>
    <button class="tb sm" id="b-menu" aria-label="Menu" title="Menu">${ICON.menu}</button>
  </div>
  <div class="bmbar" id="bmbar"></div>
  <div class="vwrap" id="vwrap">
    <div class="view" id="view"><div id="page"></div></div>
    <div class="overlay" id="overlay"></div>
  </div>
  <div class="status"><span class="panel msg" id="msg">Done</span><span class="panel prog"><span class="bar" id="bar"></span></span><span class="panel zone"><span class="globe"></span><span class="lbl">Internet</span></span></div>
</div>`;
    const r = this.root;
    this.el = {
      win: $(r, '#win'), tt: $(r, '#tt'), throb: $(r, '#throb'),
      back: $(r, '#b-back'), fwd: $(r, '#b-fwd'), reload: $(r, '#b-reload'), star: $(r, '#b-star'), menu: $(r, '#b-menu'),
      form: $(r, '#addr-form'), addr: $(r, '#addr'), fav: $(r, '#addr-fav'), fill: $(r, '#fill'),
      bmbar: $(r, '#bmbar'), view: $(r, '#view'), page: $(r, '#page'), overlay: $(r, '#overlay'), vwrap: $(r, '#vwrap'),
      msg: $(r, '#msg'), bar: $(r, '#bar'),
    };
    this.renderBookmarks();
    this.wire();
  }

  wire() {
    const e = this.el;
    e.back.addEventListener('click', () => { this.sound('click'); this.back(); });
    e.fwd.addEventListener('click', () => { this.sound('click'); this.forward(); });
    e.reload.addEventListener('click', () => { this.sound('click'); this.loading ? this.stop() : this.reload(); });
    e.star.addEventListener('click', () => { this.sound('click'); this.toggleBookmark(); });
    e.menu.addEventListener('click', (ev) => { ev.stopPropagation(); this.sound('click'); this.svc.menu ? this.svc.menu(this) : null; });
    e.form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const v = e.addr.value;
      e.addr.blur();
      this.svc.closeSuggest?.();
      if (v.trim()) this.go(v, {}, { typed: true });
    });
    e.addr.addEventListener('focus', () => { setTimeout(() => e.addr.select(), 0); });
    e.addr.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') { e.addr.value = this.current ? this.current.url : ''; e.addr.blur(); } });
    e.addr.addEventListener('input', () => this.svc.suggest?.(this, e.addr.value));
    e.addr.addEventListener('blur', () => setTimeout(() => this.svc.closeSuggest?.(), 200));

    // Links inside pages
    const page = e.page;
    page.addEventListener('click', (ev) => {
      const a = ev.target.closest('[data-go]');
      if (a && page.contains(a)) {
        ev.preventDefault();
        this.sound('click');
        this.go(a.dataset.go, {
          t: a.dataset.t || (a.textContent || '').trim().slice(0, 120),
          topic: a.dataset.topic, site: a.dataset.site, kind: a.dataset.kind, from: a.dataset.from,
        });
      }
    });
    page.addEventListener('submit', (ev) => {
      const f = ev.target;
      if (f.dataset.search == null) return;
      ev.preventDefault();
      const input = f.querySelector('[name=q]');
      const q = (input && input.value || '').trim();
      if (!q) return;
      input.blur();
      this.sound('click');
      this.go(f.dataset.search + encodeURIComponent(q).replace(/%20/g, '+'), { t: q });
    });
    page.addEventListener('mouseover', (ev) => {
      const a = ev.target.closest('[data-go]');
      if (a && !this.loading) this.status(shortUrl(a.dataset.go));
    });
    page.addEventListener('mouseout', (ev) => {
      if (ev.target.closest('[data-go]') && !this.loading) this.status('Done');
    });

    this.el.bmbar.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-bm]');
      if (b) { this.sound('click'); this.go(b.dataset.bm); }
    });

    this.root.querySelectorAll('[data-ui]').forEach((b) => b.addEventListener('click', () => this.svc.windowButton ? this.svc.windowButton(b.dataset.ui, this) : this.toast('Nice try!')));

    let st = 0;
    e.view.addEventListener('scroll', () => {
      clearTimeout(st);
      st = setTimeout(() => { const s = this.session.stack[this.session.idx]; if (s) { s.scroll = Math.round(e.view.scrollTop); this.saveSession(); } }, 300);
    }, { passive: true });

    document.addEventListener('keydown', (ev) => {
      if (ev.altKey && ev.key === 'ArrowLeft') { ev.preventDefault(); this.back(); }
      else if (ev.altKey && ev.key === 'ArrowRight') { ev.preventDefault(); this.forward(); }
      else if (ev.key === 'F5') { ev.preventDefault(); this.reload(); }
      else if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'l') { ev.preventDefault(); e.addr.focus(); }
      else if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'd') { ev.preventDefault(); this.toggleBookmark(); }
    });

    // The phone's own back gesture/button goes back inside the game
    // instead of leaving it.
    try {
      history.replaceState({ ow: 0 }, '');
      history.pushState({ ow: 1 }, '');
      window.addEventListener('popstate', () => {
        history.pushState({ ow: 1 }, '');
        this.back();
      });
    } catch { /* some embeds forbid history */ }
  }

  makeApi() {
    return {
      go: (url, hint) => this.go(url, hint || {}),
      toast: (m) => this.toast(m),
      alert: (m, t) => this.alert(m, t),
      sound: (n) => this.sound(n),
      status: (m) => this.status(m),
      overlay: this.el.overlay,
      view: this.el.view,
      onLeave: (fn) => this.leaveHooks.push(fn),
      // Save changes to the current page (guestbook entries, comments...)
      save: (patch) => {
        if (!this.current) return;
        this.current.state = { ...(this.current.state || {}), ...patch };
        pages.put(this.current);
      },
      state: () => (this.current && this.current.state) || {},
      settings: () => this.settings,
      browser: this,
    };
  }

  // ---------------- navigation ----------------
  start() {
    const s = this.session;
    if (s.stack.length && s.idx >= 0 && s.stack[s.idx]) this.load(s.stack[s.idx].url, {}, 'restore');
    else this.go(HOME);
  }

  go(input, hint = {}, o = {}) {
    let url = null;
    const raw = String(input || '').trim();
    if (/^(https?:\/\/|about:)/i.test(raw) && !o.typed) url = canon(raw);
    else url = fromInput(raw);
    if (!url) { this.toast('That address does not look right.'); return; }
    this.load(url, hint, 'push');
  }
  back() { if (this.session.idx > 0) this.load(this.session.stack[this.session.idx - 1].url, {}, 'back', this.session.idx - 1); }
  forward() { if (this.session.idx < this.session.stack.length - 1) this.load(this.session.stack[this.session.idx + 1].url, {}, 'fwd', this.session.idx + 1); }
  reload() { if (this.current) this.load(this.current.url, {}, 'reload'); }
  home() { this.go(HOME); }
  stop() {
    this.token++;
    this.setLoading(false);
    this.status('Stopped');
    this.progress(0);
  }

  async wait(ms, token) {
    await sleep(ms);
    return token === this.token;
  }

  async load(url, hint = {}, mode = 'push', targetIdx) {
    const token = ++this.token;
    const sp = SPEEDS[this.settings.speed] || SPEEDS.dsl;
    const p = parse(url);
    const host = p && p.host ? p.host : url;
    this.setLoading(true);
    this.el.addr.value = url;
    this.el.fav.innerHTML = favicon(url);
    this.progress(0.04);
    const isAbout = url.startsWith('about:');
    if (!isAbout) this.status(`Looking up ${host}...`);

    let page = mode === 'reload' ? null : await pages.get(url);
    if (page && ((page.source !== 'ai' && page.v !== GEN_VERSION) || (page.exp && page.exp < Date.now()))) page = null;
    if (mode === 'reload' && !page) {
      const old = await pages.get(url);
      if (old && old.source === 'ai' && old.v === GEN_VERSION) page = old; // keep AI pages on reload
      else if (old && old.state) hint = { ...hint, _state: old.state };
    }
    const cached = !!page;
    const quick = isAbout || mode === 'restore';
    const jit = () => Math.random() * sp.jitter;

    if (!quick && !(await this.wait((cached ? 0.3 : 1) * (sp.lookup + jit() * 0.3), token))) return;
    if (!isAbout) this.status(`Connecting to ${host}...`);
    this.progress(0.14);

    if (!page) {
      try {
        page = await this.produce(url, hint, token, host);
      } catch (err) {
        console.error(err);
        page = generate(url, hint);
      }
      if (token !== this.token) return;
      if (hint._state) page.state = hint._state;
      pages.put(page);
    }
    if (!quick) {
      this.status(`Transferring data from ${host}...`);
      this.progress(0.6);
      if (!(await this.wait((cached ? 0.35 : 1) * (sp.transfer + jit()), token))) return;
    }
    if (token !== this.token) return;

    // Commit to session history
    const s = this.session;
    const cur = s.stack[s.idx];
    if (cur) cur.scroll = Math.round(this.el.view.scrollTop);
    let scroll = 0;
    if (mode === 'push') {
      s.stack = s.stack.slice(0, s.idx + 1);
      if (!cur || cur.url !== url) { s.stack.push({ url, scroll: 0 }); s.idx = s.stack.length - 1; }
      if (s.stack.length > 100) { s.stack.shift(); s.idx--; }
    } else if (mode === 'back' || mode === 'fwd') {
      s.idx = targetIdx;
      scroll = (s.stack[s.idx] && s.stack[s.idx].scroll) || 0;
    } else if (mode === 'restore') {
      scroll = (cur && cur.scroll) || 0;
    } else if (mode === 'reload' && cur) {
      scroll = cur.scroll || 0;
    }
    this.saveSession();
    this.show(page, { scroll, reveal: mode === 'push' || mode === 'reload', token, sp });
    this.svc.onVisit?.(page, mode);
    this.progress(1);
    this.status('Done');
    setTimeout(() => { if (token === this.token) { this.setLoading(false); this.progress(0); } }, 350);
  }

  // Built-in generator by default; main.js swaps in the AI writer.
  async produce(url, hint, token, host) {
    if (this.svc.produce) {
      return this.svc.produce(url, hint, {
        onWait: (msg) => { if (token === this.token) this.status(msg || `Waiting for ${host}...`); },
        onProgress: (x) => { if (token === this.token) this.progress(0.14 + x * 0.45); },
      });
    }
    return generate(url, hint);
  }

  show(page, o = {}) {
    for (const fn of this.leaveHooks.splice(0)) { try { fn(); } catch (e) { console.error(e); } }
    for (const fn of this.cleanups.splice(0)) { try { fn(); } catch (e) { console.error(e); } }
    clearTimeout(this.revealTimer);
    this.el.overlay.innerHTML = '';
    this.current = page;
    let out;
    try {
      out = renderPage(page);
    } catch (err) {
      console.error('render failed', err);
      const fresh = generate(page.url, {});
      this.current = page = fresh;
      out = renderPage(fresh);
    }
    const pe = this.el.page;
    pe.innerHTML = out.html;
    this.el.view.scrollTop = o.scroll || 0;
    const title = page.title || shortUrl(page.url);
    this.el.tt.textContent = `${title} - NetSkipper`;
    document.title = `${title} - The Old Web`;
    if (document.activeElement !== this.el.addr) this.el.addr.value = page.url;
    this.el.fav.innerHTML = favicon(page.url);
    this.updateNav();
    if (out.mod.mount) {
      try {
        const c = out.mod.mount(pe.firstElementChild || pe, page.content, out.ctx, this.api);
        if (typeof c === 'function') this.cleanups.push(c);
      } catch (err) { console.error('mount failed', err); }
    }
    if (this.svc.decorate) {
      try { const c = this.svc.decorate(pe, page, out.ctx, this.api); if (typeof c === 'function') this.cleanups.push(c); } catch (err) { console.error(err); }
    }
    if (o.reveal && o.sp && o.sp.reveal > 15) this.reveal(o.token, o.sp.reveal);
  }

  // Paint the page top to bottom, like a slow connection.
  reveal(token, interval) {
    const pe = this.el.page;
    const items = [...pe.querySelectorAll('.rv')];
    if (!items.length) return;
    pe.classList.add('reveal');
    const viewH = this.el.view.clientHeight;
    let i = 0;
    const step = () => {
      if (token !== this.token) { pe.classList.remove('reveal'); return; }
      const n = Math.max(1, Math.ceil(items.length / 14));
      for (let k = 0; k < n && i < items.length; k++) items[i++].classList.add('on');
      // once we are below the fold, finish quickly
      const last = items[i - 1];
      const fast = last && last.offsetTop > viewH * 1.5;
      if (i < items.length) this.revealTimer = setTimeout(step, fast ? 10 : interval);
      else { pe.classList.remove('reveal'); items.forEach((x) => x.classList.remove('on')); }
    };
    step();
  }

  updateNav() {
    const s = this.session;
    this.el.back.disabled = !(s.idx > 0);
    this.el.fwd.disabled = !(s.idx < s.stack.length - 1);
    const marked = this.current && this.bookmarks.some((b) => b.url === this.current.url);
    this.el.star.innerHTML = marked ? ICON.star : ICON.starO;
    this.el.star.classList.toggle('on', !!marked);
  }

  saveSession() {
    kv.set('session', this.session);
  }
  saveSettings() {
    kv.set('settings', this.settings);
  }

  // ---------------- chrome bits ----------------
  setLoading(on) {
    this.loading = on;
    this.el.win.classList.toggle('loading', on);
    this.el.view.classList.toggle('busy', on);
    this.el.reload.innerHTML = on ? ICON.stop : ICON.reload;
    this.el.reload.setAttribute('aria-label', on ? 'Stop' : 'Reload');
  }
  status(m) { this.el.msg.textContent = m; delete this.el.msg.dataset.sc; }
  progress(x) {
    const v = Math.max(0, Math.min(1, x));
    this.el.bar.style.transform = `scaleX(${v})`;
    this.el.fill.style.transform = `scaleX(${v})`;
    if (v === 0) { this.el.fill.style.transition = 'none'; this.el.bar.style.transition = 'none'; requestAnimationFrame(() => { this.el.fill.style.transition = ''; this.el.bar.style.transition = ''; }); }
  }
  sound(name) {
    if (this.settings.sound && this.svc.sound) this.svc.sound(name);
  }

  toast(msg, ms = 2600) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    this.el.vwrap.appendChild(t);
    setTimeout(() => t.remove(), ms);
  }

  // A 2012-style "Message from webpage" dialog.
  alert(msg, title = 'Message from webpage', buttons = ['OK']) {
    return new Promise((resolve) => {
      const d = document.createElement('div');
      d.className = 'dlg-back';
      d.innerHTML = `<div class="dlg" role="dialog"><div class="dlg-t">${esc(title)}<button class="dlg-x" data-i="-1" aria-label="Close">&#10005;</button></div><div class="dlg-b"><span class="dlg-ico">!</span><p>${esc(msg)}</p></div><div class="dlg-f">${buttons.map((b, i) => `<button class="btn-ui" data-i="${i}">${esc(b)}</button>`).join('')}</div></div>`;
      d.addEventListener('click', (ev) => {
        const b = ev.target.closest('[data-i]');
        if (!b) return;
        this.sound('click');
        d.remove();
        resolve(+b.dataset.i);
      });
      this.el.vwrap.appendChild(d);
      this.sound('ding');
    });
  }

  // ---------------- bookmarks ----------------
  renderBookmarks() {
    this.el.bmbar.innerHTML = this.bookmarks.map((b) => `<button class="bm" data-bm="${esc(b.url)}" title="${esc(b.url)}">${favicon(b.url)}<span>${esc(b.title)}</span></button>`).join('');
  }
  saveBookmarks() {
    kv.set('bookmarks', this.bookmarks);
    this.renderBookmarks();
    this.updateNav();
  }
  toggleBookmark() {
    if (!this.current) return;
    const url = this.current.url;
    const i = this.bookmarks.findIndex((b) => b.url === url);
    if (i >= 0) { this.bookmarks.splice(i, 1); this.toast('Bookmark removed.'); }
    else { this.bookmarks.push({ url, title: (this.current.title || shortUrl(url)).slice(0, 60) }); this.toast('Bookmarked! Find it on the bookmarks bar.'); }
    this.saveBookmarks();
  }
}
