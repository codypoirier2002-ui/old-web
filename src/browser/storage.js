// Saving: small things in localStorage, visited pages in IndexedDB.
const NS = 'oldweb:';

export const kv = {
  get(k, def) {
    try {
      const v = localStorage.getItem(NS + k);
      return v == null ? def : JSON.parse(v);
    } catch { return def; }
  },
  set(k, v) {
    try { localStorage.setItem(NS + k, JSON.stringify(v)); return true; } catch { return false; }
  },
  del(k) { try { localStorage.removeItem(NS + k); } catch { /* ignore */ } },
  clearAll() {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(NS)) keys.push(k); }
      keys.forEach((k) => localStorage.removeItem(k));
    } catch { /* ignore */ }
  },
};

let dbp = null;
function db() {
  if (dbp) return dbp;
  dbp = new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const req = indexedDB.open('oldweb', 1);
      req.onupgradeneeded = () => { req.result.createObjectStore('pages', { keyPath: 'url' }); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch { resolve(null); }
  });
  return dbp;
}

// Small in-memory layer so going back is instant.
const mem = new Map();
function remember(url, page) {
  mem.delete(url);
  mem.set(url, page);
  if (mem.size > 150) mem.delete(mem.keys().next().value);
}

function req(store, mode, fn) {
  return db().then((d) => new Promise((resolve) => {
    if (!d) return resolve(null);
    try {
      const tx = d.transaction('pages', mode);
      const r = fn(tx.objectStore('pages'));
      if (r) { r.onsuccess = () => resolve(r.result ?? null); r.onerror = () => resolve(null); }
      else { tx.oncomplete = () => resolve(true); tx.onerror = () => resolve(null); }
    } catch { resolve(null); }
  }));
}

export const pages = {
  async get(url) {
    if (mem.has(url)) return mem.get(url);
    const v = await req('pages', 'readonly', (s) => s.get(url));
    if (v) remember(url, v);
    return v || null;
  },
  async put(page) {
    remember(page.url, page);
    await req('pages', 'readwrite', (s) => { s.put(page); return null; });
  },
  async count() { return (await req('pages', 'readonly', (s) => s.count())) || 0; },
  async clear() { mem.clear(); await req('pages', 'readwrite', (s) => { s.clear(); return null; }); },
};
