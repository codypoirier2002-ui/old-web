// Searchasaurus: the search engine. Results point to brand-new invented
// sites about whatever you searched for.
import { LEX } from '../core/lex.js';
import { HOSTS, searchUrl } from '../core/url.js';
import { fmt, titleCase, cap, slug } from '../core/util.js';
import { Rng } from '../core/rng.js';
import { esc, lnk, gl, each } from '../render/html.js';
import { site as siteLink, page as P } from '../core/links.js';
import { deBrand } from '../core/site.js';
import { kit, list, productName } from './common.js';
import { clanName } from '../core/names.js';

export const RESULT_KINDS = ['fan', 'forum', 'blog', 'video', 'howto', 'news', 'game', 'clan', 'chat', 'personal', 'trickshot'];

const RT = {
  fan: ['~*~ {Q} Fan Page!!! ~*~', '{Q} 4 Ever - The Ultimate {Q} Shrine', 'I <3 {Q} - pics, facts & more', '{Q} Fan Club (Official-ish)'],
  forum: ['Is {q} overrated?? - {Q} Talk Forums', '{Q} vs {food}: the final debate - Message Board', 'Help!! Question about {q} - {Q} Community', 'Post your {q} pics! - {Q} Forums'],
  blog: ['My thoughts on {q} | Random Ramblings', 'I finally tried {q} (it was {adj}) - Blogaroo', 'Why {q} changed my life - a blog', 'Dear {q}, we need to talk'],
  video: ['{q} (ORIGINAL) - Vidoodle', 'EPIC {q} compilation #{n} - Vidoodle', 'my {animal} vs {q} - Vidoodle', 'how 2 {q} (tutorial) HD - Vidoodle'],
  howto: ['How to Choose the Best {Q} - HowToTown', 'How to Clean Your {Q} in {n} Easy Steps', 'How to Draw {Q} - HowToTown', 'How to Explain {Q} to Your Grandma'],
  news: ['{Q} Craze Sweeps {town} - StartBlaster News', 'Scientists Baffled by {Q} - StartBlaster News', 'Local {person:title} Collects {big} {Q} Items'],
  game: ['{Q} Game - Play Free Online at Arcadeville', 'Super {Q} Dash - Free Flash Game', '{Q} Catcher 2 - Arcadeville'],
  clan: ['[{tag}] {Q} Clan - NOW RECRUITING', 'The {Q} Squad - Official Clan Site'],
  chat: ['{Q} Chat Room - Chatterbox', 'Talk About {Q} Live! - Chatterbox'],
  personal: ['{name}\'s Homepage - my {q} page', 'Welcome to {name}\'s World of {Q}'],
  trickshot: ['{Q} Trickshot Montage #{n} - INSANE', 'Best {Q} Trickshots 2012'],
};
const SNIP = [
  'Everything you need to know about {q}. Pics, facts, links and MORE!!! Updated daily (well, sometimes)...',
  'Welcome to the #1 place for {q} on the web. Join {big} other fans who love {q} as much as you do.',
  'ok so I have been thinking about {q} a lot lately and here is what I think... Posted by {user} on {month} {n}, 2012.',
  '{Q} is one of the most {adj} things in the world. In this guide we explain why {q} is so popular and how to get started.',
  'Re: {q}?? &middot; lol no way. {q} is way better than {food}. I have {n} of them at home...',
  'Watch this {adj} video about {q}! {big} views. "this made my day" - top comment.',
  'Cached &middot; {Q} - from {town} to the whole world. Find {q} pictures, {q} songs, {q} games and much more.',
];

const SNIP_FOR = { fan: [0, 1], forum: [4], blog: [2], video: [5], trickshot: [5], howto: [3], news: [6], personal: [0, 2] };

const titleQ = (q) => titleCase(q).slice(0, 50);

function resultsFor(q, page, r) {
  const k = kit({ r, site: { topic: q, name: '' } }, { q, Q: titleQ(q), person: LEX.person, tag: () => q.slice(0, 3).toUpperCase(), name: LEX.firstName });
  return list(10, (i) => {
    const rr = r.fork(`r${i}:${page}`);
    const kind = i === 0 ? 'fan' : rr.pick(RESULT_KINDS);
    const sn = SNIP_FOR[kind] || [1, 6];
    return { title: k.say(rr.pick(RT[kind]), { q, Q: titleQ(q) }), snippet: k.say(SNIP[rr.pick(sn)], { q, Q: titleQ(q) }), kind, topic: q };
  });
}

// Where a result goes. Same inputs -> same address, for built-in and AI results alike.
export function resultUrl(item, i, q) {
  const r = new Rng(`res:${q}:${i}:${item.title}`);
  const t = String(item.topic || q).slice(0, 40);
  const title = String(item.title || '').replace(/\s+-\s+[^-]+$/, '').trim() || t;
  switch (item.kind) {
    case 'forum': { const s = siteLink('forum', r, t); return { url: P.thread(s.url, title.replace(/\s*-\s*.*$/, '')), topic: t, site: s.site, kind: 'forum' }; }
    case 'blog': { const s = siteLink('blog', r, t); return { url: P.post(s.url, title, r.int(1, 11)), topic: t, site: s.site, kind: 'blog' }; }
    case 'video': return { url: P.watch(title), kind: 'video' };
    case 'howto': return { url: P.guide(title), kind: 'howto' };
    case 'news': return { url: P.story(title), kind: 'news' };
    case 'game': return { url: P.game(title), kind: 'games' };
    case 'chat': return { url: P.room(t), kind: 'chat' };
    case 'clan': { const s = siteLink('clan', r, `${titleCase(t).split(' ').slice(0, 2).join(' ')} ${r.pick(['Clan', 'Squad', 'Legion', 'Crew'])}`); return { url: s.url, topic: s.topic, site: s.site, kind: 'clan' }; }
    case 'trickshot': { const s = siteLink('trickshot', r, clanName(r)); return { url: s.url, topic: s.topic, site: s.site, kind: 'trickshot' }; }
    case 'personal': { const s = siteLink('personal', r, t); return { url: s.url, topic: t, site: s.site, kind: 'personal' }; }
    default: { const s = siteLink('fan', r, t); return { url: s.url, topic: t, site: s.site, kind: 'fan' }; }
  }
}

function bold(text, q) {
  let h = esc(text);
  const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 2).map((w) => w.replace(/[^a-z0-9]/g, '')).filter(Boolean);
  for (const w of words) h = h.replace(new RegExp(`\\b(${w})`, 'gi'), '<b>$1</b>');
  return h.replace(/&amp;middot;/g, '&middot;');
}

function logo(big) {
  return `<span class="sx-logo${big ? ' big' : ''}"><svg class="sx-dino" viewBox="0 0 64 48" aria-hidden="true"><path d="M8 40c0-10 8-18 20-18h6c2-8 8-14 16-14 6 0 10 4 10 9s-4 7-8 7h-4v10c0 6-4 10-10 10H22l-4 4h-4l2-6c-4-1-8-1-8-2z" fill="#5cb85c" stroke="#2e6b2e" stroke-width="2"/><circle cx="50" cy="15" r="2"/><path d="M14 44l-2 4M30 44v4" stroke="#2e6b2e" stroke-width="3"/></svg><span class="sx-w"><i style="color:#3366cc">S</i><i style="color:#e53935">e</i><i style="color:#fbc02d">a</i><i style="color:#3366cc">r</i><i style="color:#43a047">c</i><i style="color:#e53935">h</i><i style="color:#8e24aa">a</i><i style="color:#fb8c00">s</i><i style="color:#3366cc">a</i><i style="color:#43a047">u</i><i style="color:#e53935">r</i><i style="color:#fbc02d">u</i><i style="color:#3366cc">s</i></span></span>`;
}

export const searchHome = {
  gen(ctx) {
    const k = kit(ctx);
    return { pages: k.r.big(4000000000, 9000000000), tip: k.say(['Try searching for {animal:s} in hats!', 'Tip: you can search for anything. Even {food}.', 'New! Search the web 0.0001 seconds faster.']) };
  },
  title: () => 'Searchasaurus',
  render(c) {
    return `<div class="pg search sx-home">
  <div class="rv sx-top">${lnk(`http://${HOSTS.portal}/`, 'StartBlaster!')} &middot; ${lnk(`http://${HOSTS.mail}/`, 'Mail')} &middot; ${lnk(`http://${HOSTS.video}/`, 'Videos')}</div>
  <div class="rv sx-center">${logo(true)}
    <form class="sx-form" data-search="${esc(searchUrl(''))}"><input name="q" type="search" autocomplete="off" autocapitalize="off" enterkeyhint="search" aria-label="Search"><div class="sx-btns">${gl('Searchasaurus Search', { type: 'submit', cls: 'silver' })} ${gl('Surprise Me!', { act: 'surprise', cls: 'silver' })}</div></form>
    <p class="sx-tip">${esc(c.tip)}</p>
  </div>
  <div class="rv sx-tb"><b>NEW!</b> Get the Searchasaurus Toolbar! Search from anywhere. Now with 3 extra toolbars. ${gl('Download', { act: 'toolbar', cls: 'sm green' })}</div>
  <div class="rv sx-foot">Searching ${fmt(c.pages)} web pages &middot; &copy;2012 Searchasaurus &middot; Rawr means "search" in dinosaur</div>
</div>`;
  },
  mount(el, c, ctx, api) {
    el.querySelector('[data-act="surprise"]')?.addEventListener('click', () => {
      const r = new Rng(String(Date.now()));
      const s = siteLink(r.pick(['fan', 'blog', 'forum', 'personal', 'clan']), r);
      api.go(s.url, { topic: s.topic, site: s.site, kind: s.kind });
    });
    el.querySelector('[data-act="toolbar"]')?.addEventListener('click', () => api.alert('The Searchasaurus Toolbar is already installed. And twice more for good luck.', 'Searchasaurus'));
    setTimeout(() => { try { el.querySelector('input[name=q]')?.focus({ preventScroll: true }); } catch { /* ignore */ } }, 50);
  },
};

export const results = {
  gen(ctx) {
    const raw = String(ctx.params.q || '').slice(0, 100);
    const q = deBrand(raw).toLowerCase().trim() || 'stuff';
    const page = ctx.params.page || 1;
    const k = kit({ r: ctx.r, site: { topic: q, name: '' } }, { person: LEX.person });
    const r = ctx.r;
    return {
      q: raw,
      topic: q,
      page,
      total: r.big(1200, 90000000),
      secs: (r.int(9, 48) / 100).toFixed(2),
      didYouMean: r.chance(0.2) ? k.say(['{q} for {animal:s}', '{q} pictures', 'cute {q}', '{q} (the good kind)'], { q }) : '',
      ads: list(r.int(1, 2), (i) => { const rr = r.fork('ad' + i); const pr = productName(rr); return { title: `${pr} - Official Site`, line: k.say(rr.pick(['The #1 choice for {q} lovers. Free shipping!', 'Why pay more? {q} accessories from $9.99', 'As seen on TV! Order now.']), { q }), product: pr }; }),
      results: resultsFor(q, page, r),
      related: [`${q} pictures`, `${q} for sale`, `how to draw ${q}`, `${q} forum`, `${q} games`, `funny ${q}`],
    };
  },
  title: (c) => `${c.q} - Searchasaurus Search`,
  render(c) {
    const base = (p) => searchUrl(c.q, p);
    return `<div class="pg search">
  <div class="rv sx-bar">${lnk(`http://${HOSTS.search}/`, '', { html: logo(false) })}<form class="sx-form sm" data-search="${esc(searchUrl(''))}"><input name="q" type="search" value="${esc(c.q)}" autocomplete="off" autocapitalize="off" enterkeyhint="search" aria-label="Search">${gl('Search', { type: 'submit', cls: 'sm silver' })}</form></div>
  <div class="rv sx-stats">Results <b>${(c.page - 1) * 10 + 1} - ${c.page * 10}</b> of about <b>${fmt(c.total)}</b> for <b>${esc(c.q)}</b>. (${c.secs} seconds)</div>
  ${c.didYouMean ? `<div class="rv sx-dym">Did you mean: ${lnk(searchUrl(c.didYouMean), '', { html: `<b><i>${esc(c.didYouMean)}</i></b>` })}</div>` : ''}
  <div class="rv sx-ads"><small>Sponsored Links</small>${each(c.ads, (a) => `<div class="sx-ad"><a data-act="adlink" data-product="${esc(a.product)}">${esc(a.title)}</a><br>${esc(a.line)}<br><span class="sx-url">www.${esc(slug(a.product).replace(/-/g, ''))}.com</span></div>`)}</div>
  <ol class="sx-res">${each(c.results, (it, i) => {
    const u = resultUrl(it, i + (c.page - 1) * 10, c.topic);
    return `<li class="rv">${lnk(u.url, it.title, { topic: u.topic, site: u.site, kind: u.kind, cls: 'sx-t', t: it.title })}<div class="sx-s">${bold(it.snippet, c.topic)}</div><div class="sx-url">${esc(u.url.replace(/^http:\/\//, '').slice(0, 60))} - <span class="sx-c">Cached</span> - <span class="sx-c">Similar</span></div></li>`;
  })}</ol>
  <div class="rv sx-rel"><b>Searches related to ${esc(c.q)}</b><div>${each(c.related, (x) => lnk(searchUrl(x), x))}</div></div>
  <div class="rv sx-pages">${c.page > 1 ? lnk(base(c.page - 1), '', { html: '&laquo; Previous' }) : ''} ${list(10, (i) => (i + 1 === c.page ? `<b>${i + 1}</b>` : lnk(base(i + 1), String(i + 1)))).join(' ')} ${lnk(base(c.page + 1), '', { html: 'Next &raquo;' })}</div>
  <div class="rv sx-foot">&copy;2012 Searchasaurus &middot; ${lnk(`http://${HOSTS.search}/`, 'Searchasaurus Home')}</div>
</div>`;
  },
};

void cap;
