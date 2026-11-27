// A "site" is a host (or a ~user folder on the free host). Each site has a
// kind (forum, fan page, blog...), a name and a topic, decided the first
// time you visit and saved so it looks the same when you come back.
import { HOSTS } from './url.js';
import { LEX, DICT_EXTRA, REAL_NAMES, INVENTED_SWAPS } from './lex.js';
import { Rng, hash } from './rng.js';
import { plural, titleCase } from './util.js';
import { kv } from '../browser/storage.js';

export const KINDS = ['portal', 'news', 'search', 'video', 'mail', 'games', 'chat', 'howto', 'forum', 'fan', 'clan', 'trickshot', 'blog', 'personal', 'shop'];

const SPECIAL = {
  [HOSTS.portal]: 'portal',
  [HOSTS.news]: 'news',
  [HOSTS.search]: 'search',
  [HOSTS.video]: 'video',
  [HOSTS.mail]: 'mail',
  [HOSTS.games]: 'games',
  [HOSTS.chat]: 'chat',
  [HOSTS.howto]: 'howto',
};
const SPECIAL_NAMES = {
  portal: 'StartBlaster!', news: 'StartBlaster News', search: 'Searchasaurus', video: 'Vidoodle', mail: 'MailMole',
  games: 'Arcadeville', chat: 'Chatterbox', howto: 'HowToTown',
};

const SPECIAL_TOPICS = { portal: 'the web', news: 'news', search: 'the web', video: 'videos', mail: 'email', games: 'games', chat: 'chatting', howto: 'how-to guides' };

// Endings that link builders always use, checked first.
const SUFFIX = [
  ['shop', /(official|shop|store|direct|deals)$/],
  ['trickshot', /(trickshots|montages)$/],
  ['clan', /^clan|clan$/],
  ['fan', /(4ever|4evr|fans|fanzone|fanclub|shrine|lovers|starz)$/],
  ['forum', /(talk|forums|board|community|bbs|debate)$/],
  ['howto', /(tips|guide|help|diy)$/],
];
const RULES = [
  ['mail', /mail|inbox|postbox/],
  ['search', /search|seek|lookup|finder/],
  ['chat', /chat|lounge|irc|hangout/],
  ['trickshot', /trickshot|montage/],
  ['clan', /clan/],
  ['trickshot', /trick|snip|scope|frag|shots/],
  ['clan', /squad|guild|crew|team|xx|gaming|pwn|elite|leet|1337|legion/],
  ['forum', /forum|board|bbs|talk|community|discuss|debate|argue/],
  ['games', /game|arcade|play|flash|puzzle/],
  ['video', /tube|vid|clip|movie|tv|film|watch/],
  ['howto', /howto|guide|tips|tutorial|diy|fixit|wiki|help|learn|advice/],
  ['blog', /blog|diary|journal|musing|thought|rambling|life/],
  ['news', /news|times|gazette|herald|tribune|chronicle/],
  ['fan', /fan|glitter|sparkle|star|angel|4ever|forever|shrine|lover|luv|cute|kawaii|club|princess|unicorn|rainbow|kitty|pony|girl/],
];
const FREEHOST_FAN = /fan|lover|4ever|girl|luv|club|glitter|sparkle|star|angel|kitty|pony|princess|rainbow|unicorn/;

export function siteKeyOf(p) {
  const m = p.path.match(/^\/~([^/]+)/);
  return m ? `${p.host}/~${m[1].toLowerCase()}` : p.host;
}
export function relPath(p, key) {
  const i = key.indexOf('/~');
  if (i === -1) return p.path || '/';
  const rest = p.path.slice(key.length - i);
  return rest || '/';
}
export function siteRoot(site) {
  return `http://${site.key}/`;
}

function hostCore(host) {
  const labels = host.split('.').filter((l) => l !== 'www');
  if (labels.length > 1) labels.pop();
  return labels.join(' ').replace(/[-_]/g, ' ');
}

export function classify(key, hintKind) {
  const [host, user] = key.split('/~');
  if (SPECIAL[host] && !user) return SPECIAL[host];
  if (host.endsWith('.' + HOSTS.blogs)) return 'blog';
  if (hintKind && HINTABLE.has(hintKind)) return hintKind;
  if (host === HOSTS.freehost) {
    if (!user) return 'personal';
    return FREEHOST_FAN.test(user) ? 'fan' : 'personal';
  }
  const core = hostCore(host).replace(/ /g, '');
  for (const [kind, re] of SUFFIX) if (re.test(core)) return kind;
  for (const [kind, re] of RULES) if (re.test(core)) return kind;
  return new Rng('kind:' + key).weighted({ fan: 3, blog: 3, forum: 2, personal: 3, howto: 1, clan: 1, video: 1 });
}
const HINTABLE = new Set(['fan', 'forum', 'blog', 'clan', 'trickshot', 'howto', 'personal', 'video', 'games', 'chat', 'news', 'shop']);

// ---------- word splitting for typed addresses ----------
let DICT = null;
function dict() {
  if (DICT) return DICT;
  DICT = new Set(DICT_EXTRA);
  for (const w of DICT_EXTRA) if (w.length > 2) DICT.add(w + 's');
  const add = (w) => { for (const part of String(w).toLowerCase().split(/[^a-z0-9]+/)) if (part.length > 1) { DICT.add(part); DICT.add(plural(part)); DICT.add(part + 's'); } };
  for (const list of Object.values(LEX)) for (const w of list) add(w);
  return DICT;
}

export function segment(str) {
  const s = String(str).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!s) return [];
  const D = dict();
  const n = s.length;
  const best = new Array(n + 1).fill(null);
  best[0] = { cost: 0, words: [] };
  for (let i = 0; i < n; i++) {
    if (!best[i]) continue;
    for (let j = i + 1; j <= Math.min(n, i + 20); j++) {
      const w = s.slice(i, j);
      let c;
      if (/^\d+$/.test(w)) c = 1;
      else if (D.has(w)) c = 1 + (w.length <= 2 ? 0.8 : 0);
      else c = 2.5 + 0.3 * w.length;
      const cost = best[i].cost + c;
      if (!best[j] || cost < best[j].cost) best[j] = { cost, words: [...best[i].words, w] };
    }
  }
  return best[n].words;
}

const AFFIX = new Set('www fans fan 4ever forever zone world central club hq the my online net web page site talk forum forums board boards bbs tube tv blog blogs diary clan squad team crew gaming tips guide guides howto how to news daily times lovers lover luv love i 4 2 u place spot land planet paradise shrine fanclub fansite trickshots trickshot trick tricks shot shots montage montages fanzone starz 4evr chat chats lounge arcade games game play video videos vid vids clips clip www inc co official home homepage city house community central express xx xxx mania nation network members member of and ur 4u'.split(' '));

export function topicFromWords(words) {
  const keep = words.filter((w) => !AFFIX.has(w) && !/^\d+$/.test(w));
  return keep.join(' ');
}

// Swap famous real names for invented ones.
export function deBrand(text) {
  let t = String(text || '');
  for (const name of REAL_NAMES) {
    const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (re.test(t)) t = t.replace(re, INVENTED_SWAPS[hash(name) % INVENTED_SWAPS.length]);
  }
  return t;
}

const FALLBACK_TOPICS = () => [...LEX.animal.map(plural), ...LEX.thing.map(plural), ...LEX.food, ...LEX.invShow, ...LEX.invBand];

function nameFromKey(key, kind) {
  const [host, user] = key.split('/~');
  if (user) return titleCase(segment(user).join(' ')) || user;
  if (host.endsWith('.' + HOSTS.blogs)) return titleCase(segment(host.split('.')[0]).join(' '));
  const words = segment(hostCore(host).replace(/ /g, ''));
  const name = words.map((w) => (/^\d+$/.test(w) ? w : w[0].toUpperCase() + w.slice(1))).join(kind === 'forum' || kind === 'video' || kind === 'clan' ? '' : ' ');
  return name || host;
}

// ---------- the site registry ----------
let cache = null;
const SITES_KEY = 'sites';
function all() { if (!cache) cache = kv.get(SITES_KEY, {}); return cache; }
let saveTimer = null;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const s = all();
    const keys = Object.keys(s);
    if (keys.length > 1500) keys.sort((a, b) => s[a].t - s[b].t).slice(0, keys.length - 1500).forEach((k) => delete s[k]);
    kv.set(SITES_KEY, s);
  }, 50);
}
export function forgetSites() { cache = {}; kv.set(SITES_KEY, {}); }

export function getSite(key, hint = {}) {
  const s = all();
  if (s[key]) return s[key];
  const kind = classify(key, hint.kind);
  const r = new Rng('site:' + key);
  let name = SPECIAL_NAMES[kind] && SPECIAL[key] ? SPECIAL_NAMES[kind] : (hint.site ? String(hint.site).slice(0, 60) : nameFromKey(key, kind));
  let topic = SPECIAL[key] ? SPECIAL_TOPICS[kind] : hint.topic ? String(hint.topic).slice(0, 60) : '';
  if (!topic) {
    const [host, user] = key.split('/~');
    const words = user ? segment(user) : host.endsWith('.' + HOSTS.blogs) ? [] : segment(hostCore(host).replace(/ /g, ''));
    topic = topicFromWords(words);
  }
  if (!topic) topic = r.pick(FALLBACK_TOPICS());
  topic = deBrand(topic).trim();
  name = deBrand(name);
  const site = { key, kind, name, topic, seed: hash(key), t: Date.now() };
  s[key] = site;
  persist();
  return site;
}
