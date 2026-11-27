// Seeded randomness. Every page is generated from a hash of its URL,
// so the same address always produces the same page.

export function hash(str) {
  str = String(str);
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h1 ^ h2) >>> 0;
}

export class Rng {
  constructor(seed) {
    this.seed0 = typeof seed === 'number' ? seed >>> 0 : hash(seed);
    this.s = this.seed0 || 1;
  }
  next() {
    let t = (this.s = (this.s + 0x6d2b79f5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(a, b) { return a + Math.floor(this.next() * (b - a + 1)); }
  float(a, b) { return a + this.next() * (b - a); }
  chance(p) { return this.next() < p; }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  sample(arr, n) { return this.shuffle(arr).slice(0, n); }
  // Independent sub-stream: adding draws to one part of a page never
  // reshuffles another part.
  fork(label) { return new Rng(hash(this.seed0 + ':' + label)); }
  weighted(obj) {
    const entries = Object.entries(obj);
    let total = 0;
    for (const [, w] of entries) total += w;
    let x = this.next() * total;
    for (const [k, w] of entries) { if ((x -= w) < 0) return k; }
    return entries[entries.length - 1][0];
  }
  // Big skewed numbers: view counts, post counts, etc.
  big(min, max) {
    const t = Math.pow(this.next(), 3);
    return Math.floor(min + t * (max - min));
  }
}
