// Lay AI-written content over the built-in content for the same page.
// The built-in version is the template: only keys it has are kept, values
// must have the same type, strings and lists are length-capped, and keys
// starting with "_" always stay built-in. The AI can never add new fields,
// links or markup (everything is escaped when rendered anyway).
const MAX_STR = 2400;
const MAX_ARR = 40;
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function clean(str) {
  return String(str)
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/<[^>]{0,200}>/g, '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .slice(0, MAX_STR);
}

export function merge(base, ai, alts = []) {
  if (Array.isArray(base)) {
    if (!Array.isArray(ai) || !ai.length) return base;
    const ex = base.length ? base : alts.find((a) => Array.isArray(a) && a.length) || [];
    if (!ex.length) return base;
    return ai.slice(0, MAX_ARR).map((item, i) => merge(ex[i % ex.length], item, ex));
  }
  if (isObj(base)) {
    if (!isObj(ai)) return base;
    const out = {};
    for (const k of Object.keys(base)) {
      if (k.startsWith('_') || !(k in ai)) out[k] = base[k];
      else out[k] = merge(base[k], ai[k], alts.map((a) => (isObj(a) ? a[k] : undefined)));
    }
    return out;
  }
  if (typeof base === 'string') {
    if (typeof ai !== 'string') return base;
    const c = clean(ai).trim();
    return c || (ai === '' ? '' : base);
  }
  if (typeof base === 'number') return typeof ai === 'number' && Number.isFinite(ai) ? Math.max(0, Math.min(1e10, Math.round(ai))) : base;
  if (typeof base === 'boolean') return typeof ai === 'boolean' ? ai : base;
  return base;
}
