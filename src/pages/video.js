// Vidoodle: the video site. Home grid, watch pages with comment wars, channels.
import { LEX } from '../core/lex.js';
import { HOSTS } from '../core/url.js';
import { fmt, deslug, cap, duration } from '../core/util.js';
import { esc, lnk, gl, each, paras } from '../render/html.js';
import { scene, avatar } from '../render/widgets.js';
import { player, mountPlayers } from '../render/player.js';
import { commentsBlock, mountComments } from '../render/comments.js';
import { page as P } from '../core/links.js';
import { kit, list, agoStr, dateOnly, username, songTitle, bandName, makeComments } from './common.js';

const VT = {
  animals: ['my {animal} tries {food} for the first time!!', '{animal:cap} vs {thing:title} (ORIGINAL)', 'Funniest {animal:s} of 2012', '{animal:cap} sneezes and scares itself', 'my {animal} is smarter than me (PROOF)', '{animal:s} in tiny hats compilation', '{animal:cap} learns to {verb} a {thing}'],
  fails: ['EPIC {thing} FAIL compilation #{n}', 'Dad tries to {verb} a {thing} (FAIL)', 'trampoline + {thing} = bad idea', 'Ultimate {thing} fails 2012', 'when {food} goes wrong'],
  music: ['{band} - {song} (Official Video)', '{song} - {band} (lyrics)', '{band} - {song} (Live at the {town} Fair)', 'me covering {song} on the {instrument}', '{song} but every word is {food}'],
  howto: ['how 2 {verb} a {thing} (tutorial) HD', '{thing} life hack you NEED to see', '5 ways to {verb} your {thing}', 'Easy {food} recipe in 5 minutes!!'],
  gaming: ['{game} gameplay part {n} (no commentary)', '{game} funny moments #{n}', '{game} - insane {n} kill streak', 'Let\'s Play {game} Episode {n}', '{game} glitch you won\'t believe'],
  vlog: ['my morning routine (2012)', 'what\'s in my backpack?!', 'VLOG #{n}: we went to {place}', 'Q&A!! answering your questions', 'unboxing my new {product}!!!', 'my {thing} collection (updated)'],
  random: ['{thing:cap} in the sky!!! what does it mean', 'my little brother explains {topic}', 'grandpa reviews {food}', '{n} hours of {thing} sounds (relaxing)', 'I put a {thing} on my {animal} and this happened', 'the {adj} {thing} song (100% original)', 'running into a {thing} at full speed (ow)'],
};
const CATS = Object.keys(VT);
const DESC = [
  'Thanks for watching!! Please like and subscribe, it really helps me out :)\n\nFilmed on my mom\'s camera. Edited with my brain.',
  'Uploaded by request. I do not own the {thing}. All rights go to the {thing}.',
  'This happened at {place} last weekend. My {person} could not stop laughing.\n\nSUBSCRIBE for more videos every Tuesday!',
  'Part {n} is coming soon if this gets {big} likes!!',
  'No {animal:s} were harmed in the making of this video. One {thing} was slightly bent.',
];
const LINES = {
  animals: ['awww the {animal} is so cute', 'i want a {animal} now', 'the way it looked at the camera lol', 'my {animal} just watched this with me and agreed'],
  music: ['this song is stuck in my head forever', '{band} is the best band of 2012', 'who else is singing along', 'goosebumps at {n}:{n2}', 'the guitar solo tho'],
  gaming: ['what graphics card do you have', 'you should play on hard mode', 'that was so clean', 'what map is this', 'sub to me i play {game} too'],
  howto: ['this actually worked!!', 'did this and now my {thing} is on fire. jk it worked', 'great tutorial thanks!!', 'step 2 confused me but i figured it out'],
};

function videoTitle(r, say, cat) {
  const c = cat || r.pick(CATS);
  return say(r.pick(VT[c]), { song: songTitle(r), band: bandName(r) });
}

function vidKit(ctx) { return kit(ctx, { person: LEX.person }); }

function mkVid(r, say, cat) {
  const title = videoTitle(r, say, cat);
  return { title, user: username(r), views: r.big(200, 9000000), dur: r.int(12, 640) };
}

function thumb(v, i) {
  return `<div class="vd-card">${lnk(P.watch(v.title), '', { html: `<span class="vd-th">${scene(v.title)}<span class="vd-dur">${duration(v.dur)}</span></span>`, t: v.title })}<div class="vd-ci">${lnk(P.watch(v.title), v.title, { cls: 'vd-tl' })}<small>by ${lnk(P.channel(v.user), v.user)}<br>${fmt(v.views)} views</small></div></div>`;
}

function shell(inner, q = '') {
  return `<div class="pg video">
  <div class="rv vd-head"><span class="vd-logo">${lnk(`http://${HOSTS.video}/`, '', { html: 'Vid<b>oodle</b>' })}</span>
    <form class="vd-search" data-search="http://${HOSTS.video}/results?q="><input name="q" type="search" value="${esc(q)}" placeholder="Search videos" autocomplete="off"><button class="gl sm silver" type="submit">Search</button></form>
    <span class="vd-up">${gl('Upload', { act: 'upload', cls: 'sm orange' })}</span></div>
  ${inner}
  <div class="rv vd-foot">&copy; 2012 Vidoodle &middot; Broadcast Yourself, Probably &middot; Help &middot; Safety &middot; Copyright</div>
</div>`;
}

export const videoHome = {
  gen(ctx) {
    const { r, say } = vidKit(ctx);
    const q = ctx.params.q || '';
    const featured = mkVid(r.fork('feat'), say);
    const vids = list(12, (i) => { const rr = r.fork('v' + i); return mkVid(rr, say, q ? null : CATS[i % CATS.length]); });
    if (q) vids.forEach((v, i) => { if (i % 2 === 0) v.title = say(['{q} (ORIGINAL)', '{q} compilation #{n}', 'the best {q} video ever', '{q}!!!! must watch', 'how to {q} (easy)', '{q} - funny moments'], { q }); });
    return { q, featured, vids, trending: list(5, (i) => videoTitle(r.fork('tr' + i), say)) };
  },
  title: (c) => (c.q ? `"${c.q}" - Vidoodle Search` : 'Vidoodle - Broadcast Yourself, Probably'),
  render(c) {
    return shell(`
  ${c.q ? `<h2 class="rv vd-h">Results for "${esc(c.q)}"</h2>` : `<div class="rv vd-feat">${lnk(P.watch(c.featured.title), '', { html: `<span class="vd-th big">${scene(c.featured.title, { caption: 'FEATURED' })}</span>`, t: c.featured.title })}<div><small>Featured video</small><br>${lnk(P.watch(c.featured.title), c.featured.title, { cls: 'vd-tl big' })}<br><small>${fmt(c.featured.views)} views</small></div></div>`}
  <h2 class="rv vd-h">${c.q ? '' : 'Videos Being Watched Right Now'}</h2>
  <div class="rv vd-grid">${each(c.vids, thumb)}</div>
  <div class="rv vd-trend"><b>Trending:</b> ${c.trending.map((t) => lnk(P.watch(t), t)).join(' &middot; ')}</div>`, c.q);
  },
  mount: (el, c, ctx, api) => mountUpload(el, api),
};

export const watch = {
  gen(ctx) {
    const { r, say } = vidKit(ctx);
    const title = ctx.hint.t || cap(deslug(ctx.params.slug));
    const cat = /song|official|lyrics|cover|live at/i.test(title) ? 'music' : /gameplay|let'?s play|glitch|kill|funny moments/i.test(title) ? 'gaming' : /how ?2|how to|tutorial|recipe|hack/i.test(title) ? 'howto' : /animal|cat|dog|hamster|llama|kitten|puppy|duck|goat|otter|panda/i.test(title) || LEX.animal.some((a) => title.toLowerCase().includes(a)) ? 'animals' : null;
    const views = r.big(300, 12000000);
    return {
      title,
      user: username(r.fork('up')),
      views,
      likes: Math.floor(views * r.float(0.002, 0.02)) + r.int(1, 40),
      dislikes: Math.floor(views * r.float(0.0002, 0.002)) + r.int(0, 9),
      date: dateOnly(r.int(1, 300)),
      dur: r.int(15, 600),
      subs: r.big(3, 900000),
      desc: say(r.pick(DESC)),
      comments: makeComments(r.fork('cm'), say, r.int(8, 14), { lines: cat && LINES[cat] }),
      totalComments: r.big(14, 20000),
      related: list(8, (i) => mkVid(r.fork('rel' + i), say, i < 3 && cat ? cat : null)),
    };
  },
  title: (c) => `${c.title} - Vidoodle`,
  render(c, ctx) {
    const pct = Math.round((c.likes / Math.max(1, c.likes + c.dislikes)) * 100);
    return shell(`
  <div class="vd-watch">
    <div class="vd-main">
      <div class="rv">${player(c.title, { dur: c.dur, title: c.title })}</div>
      <h1 class="rv vd-title">${esc(c.title)}</h1>
      <div class="rv vd-owner">${avatar(c.user, 40)}<div>${lnk(P.channel(c.user), c.user, { cls: 'vd-un' })}<br><small>${fmt(c.subs)} subscribers</small></div>${gl('Subscribe', { act: 'sub', cls: 'sm red' })}<div class="vd-views"><b>${fmt(c.views)}</b> views<div class="vd-lb"><i style="width:${pct}%"></i></div><small><span class="vd-like" data-act="vlike">&#9650; ${fmt(c.likes)}</span> &nbsp; <span class="vd-like" data-act="vdis">&#9660; ${fmt(c.dislikes)}</span></small></div></div>
      <div class="rv vd-desc"><b>Uploaded on ${esc(c.date)}</b>${paras(c.desc)}</div>
      ${commentsBlock(c.comments, ctx, { title: 'All Comments', total: c.totalComments, flavor: 'video', userUrl: P.channel })}
    </div>
    <div class="rv vd-side"><b>Suggestions</b>${each(c.related, (v) => `<div class="vd-rel">${lnk(P.watch(v.title), '', { html: `<span class="vd-th sm">${scene(v.title)}<span class="vd-dur">${duration(v.dur)}</span></span>`, t: v.title })}<div>${lnk(P.watch(v.title), v.title, { cls: 'vd-tl' })}<small>by ${esc(v.user)}<br>${fmt(v.views)} views</small></div></div>`)}</div>
  </div>`);
  },
  mount(el, c, ctx, api) {
    const a = mountPlayers(el, api);
    const b = mountComments(el, ctx, api, { userUrl: P.channel });
    mountUpload(el, api);
    el.querySelector('[data-act="sub"]')?.addEventListener('click', (e) => { e.currentTarget.textContent = 'Subscribed!'; e.currentTarget.classList.replace('red', 'silver'); api.sound('click'); });
    el.querySelectorAll('.vd-like').forEach((x) => x.addEventListener('click', () => { if (x.dataset.done) return; x.dataset.done = 1; x.classList.add('on'); x.innerHTML = x.innerHTML.replace(/[\d,]+/, (n) => fmt(parseInt(n.replace(/,/g, ''), 10) + 1)); api.sound('click'); }));
    return () => { a(); b(); };
  },
};

export const channel = {
  gen(ctx) {
    const { r, say } = vidKit(ctx);
    const user = ctx.hint.t && !/\s{2,}/.test(ctx.hint.t) && ctx.hint.t.length < 40 ? ctx.hint.t : deslug(ctx.params.user).replace(/ /g, '_');
    return {
      user,
      subs: r.big(3, 900000),
      views: r.big(1000, 90000000),
      joined: dateOnly(r.int(200, 1500)).replace(/\d+, /, ''),
      about: say(['Hi!! I make videos about {topic} and {thing:s}. New videos every {day}!', 'just a {person} with a camera and a dream', 'Welcome to my channel!! Subscribe for {adj} videos!!!', 'I upload whatever my {animal} lets me.'], { day: r.pick(['Monday', 'Tuesday', 'Friday', 'weekend']), topic: r.pick(LEX.food) }),
      vids: list(9, (i) => { const v = mkVid(r.fork('v' + i), say); v.user = user; return v; }),
    };
  },
  title: (c) => `${c.user}'s Channel - Vidoodle`,
  render(c) {
    return shell(`
  <div class="rv vd-chan">${scene(c.user + 'banner')}<div class="vd-ch-i">${avatar(c.user, 72)}<div><h1>${esc(c.user)}</h1><small>${fmt(c.subs)} subscribers &middot; ${fmt(c.views)} video views &middot; Joined ${esc(c.joined)}</small></div>${gl('Subscribe', { act: 'sub', cls: 'sm red' })}</div></div>
  <div class="rv vd-desc">${paras(c.about)}</div>
  <h2 class="rv vd-h">Uploaded videos</h2>
  <div class="rv vd-grid">${each(c.vids, thumb)}</div>`);
  },
  mount(el, c, ctx, api) {
    mountUpload(el, api);
    el.querySelector('[data-act="sub"]')?.addEventListener('click', (e) => { e.currentTarget.textContent = 'Subscribed!'; api.sound('click'); });
  },
};

function mountUpload(el, api) {
  el.querySelector('[data-act="upload"]')?.addEventListener('click', () => api.alert('Upload failed: your video is too awesome for our servers. Please try a less awesome video.'));
}

