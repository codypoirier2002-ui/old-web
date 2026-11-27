// Tiny template expander: "{animal:s} love {food}" picks from word lists.
// Modifiers: cap, upper, lower, title, s (plural), a (a/an), slug.
import { cap, titleCase, plural, article, slug } from './util.js';

const MODS = {
  cap,
  upper: (s) => s.toUpperCase(),
  lower: (s) => s.toLowerCase(),
  title: titleCase,
  s: plural,
  a: article,
  slug: (s) => slug(s),
};

const RE = /\{(\w+)(?::([\w:]+))?\}/g;

export function expand(tpl, r, lex, vars = {}, depth = 0) {
  return String(tpl).replace(RE, (m, key, mods) => {
    let v;
    if (Object.prototype.hasOwnProperty.call(vars, key)) v = vars[key];
    else if (lex[key] !== undefined) v = lex[key];
    else return m;
    if (typeof v === 'function') v = v(r, vars);
    if (Array.isArray(v)) v = r.pick(v);
    if (typeof v === 'function') v = v(r, vars);
    v = String(v);
    if (depth < 8 && v.indexOf('{') !== -1) v = expand(v, r, lex, vars, depth + 1);
    if (mods) for (const mod of mods.split(':')) if (MODS[mod]) v = MODS[mod](v);
    return v;
  });
}

// Bind a word list + rng into a short "say" function.
export function sayer(r, lex, vars) {
  const say = (tpl, extra) => expand(Array.isArray(tpl) ? r.pick(tpl) : tpl, r, lex, extra ? { ...vars, ...extra } : vars);
  say.r = r;
  say.vars = vars;
  return say;
}
