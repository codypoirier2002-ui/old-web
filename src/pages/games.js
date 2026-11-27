// Arcadeville: free online games portal with tiny playable games.
import { LEX } from '../core/lex.js';
import { HOSTS } from '../core/url.js';
import { fmt, titleCase, deslug, plural } from '../core/util.js';
import { Rng, hash } from '../core/rng.js';
import { esc, lnk, gl, each } from '../render/html.js';
import { scene, stars } from '../render/widgets.js';
import { commentsBlock, mountComments } from '../render/comments.js';
import { page as P } from '../core/links.js';
import { kit, list, username, productName, makeComments } from './common.js';
import { MECHANICS, HOWTO, mechanicFor } from '../games/games.js';
import { kv } from '../browser/storage.js';

const NOUNS = ['Pickle', 'Waffle', 'Noodle', 'Muffin', 'Potato', 'Taco', 'Nugget', 'Pancake', 'Hamster', 'Llama', 'Penguin', 'Toast', 'Duck', 'Blob', 'Gnome', 'Sock', 'Robot', 'Sloth', 'Donut', 'Jellybean', 'Cupcake', 'Otter', 'Frog', 'Turnip'];
const NAMES = {
  catcher: ['{N} Catcher', 'Catch the {N}s!', '{A} {N} Catch', '{N} Rain'],
  whack: ['Whack-a-{N}', '{N} Bonk', 'Bop the {N}', '{A} {N} Smash'],
  snake: ['Hungry {N}', '{N} Noodle', 'Slither {N}', 'Hungry Hungry {N}'],
  memory: ['{N} Memory Match', '{N} Pairs', 'Flip the {N}s', '{A} Match'],
  dodge: ['{N} Panic', '{N} Escape', 'Dodge the Blocks: {N} Edition', '{A} {N} Dodge'],
  flyer: ['{N} Copter', 'Rocket {N}', 'Jet {N} Cave', '{A} {N} Flight'],
  clicker: ['{N} Clicker', '{N} Tycoon', '{N} Empire', '{N} Factory'],
  breakout: ['{N} Brick Bash', 'Bounce {N}', '{A} Brick Bash', '{N} Bounce Blast'],
};
const ADJ = ['Super', 'Mega', 'Turbo', 'Ultra', 'Crazy', 'Cosmic', 'Pixel', 'Hyper', 'Tiny', 'Epic'];
const CATS = ['Action', 'Puzzle', 'Arcade', 'Skill', 'Idle', 'Classic'];
const CAT_OF = { catcher: 'Arcade', whack: 'Action', snake: 'Classic', memory: 'Puzzle', dodge: 'Skill', flyer: 'Skill', clicker: 'Idle', breakout: 'Classic' };
const DESC = ['The most {adj} game on the internet! Can you beat {n}0 points?', 'Addictive and FREE! Warning: you will not stop playing.', 'Our most popular game this week! Over {big} plays!', 'Perfect for when you should be doing homework.', 'Simple to learn, impossible to master!'];

function gameFor(r) {
  const mech = r.pick(Object.keys(MECHANICS));
  const noun = r.pick(NOUNS);
  const name = r.pick(NAMES[mech]).replace(/\{N\}/g, noun).replace('{A}', r.pick(ADJ));
  return { name, mech, noun };
}

export const gamesHome = {
  gen(ctx) {
    const k = kit(ctx);
    const { r, say } = k;
    const cat = ctx.params.cat ? titleCase(deslug(ctx.params.cat)) : '';
    const games = list(12, (i) => { const rr = r.fork('g' + i + cat); const g = gameFor(rr); return { name: g.name, desc: say(rr.pick(DESC)), plays: rr.big(500, 9000000), rating: rr.int(3, 5), cat: CAT_OF[g.mech], tag: rr.pick(['', '', 'NEW!', 'HOT!']) }; });
    return {
      cat, games,
      top: list(5, (i) => ({ user: username(r.fork('tp' + i)), score: r.fork('s' + i).big(1000, 99999) })).sort((a, b) => b.score - a.score),
      online: r.big(1000, 30000),
    };
  },
  title: (c) => (c.cat ? `${c.cat} Games - Arcadeville` : 'Arcadeville - 100% FREE Online Games!'),
  render(c) {
    const root = `http://${HOSTS.games}/`;
    const f = c.games[0];
    return `<div class="pg games"><div class="ga-wrap">
  <div class="rv ga-head"><span class="ga-logo">${lnk(root, '', { html: 'Arcade<b>ville</b>' })}</span><span class="ga-tag">100% FREE Online Games! &middot; ${fmt(c.online)} playing now</span></div>
  <div class="rv ga-cats">${each(CATS, (x) => lnk(`${root}category/${x.toLowerCase()}`, x, { cls: c.cat === x ? 'on' : '' }))}</div>
  ${c.cat ? `<h2 class="rv ga-h">${esc(c.cat)} Games</h2>` : `<div class="rv ga-feat">${lnk(P.game(f.name), '', { html: `<span class="ga-th big">${scene(f.name, { caption: f.name })}</span>` })}<div><small>FEATURED GAME</small><h2>${lnk(P.game(f.name), f.name)}</h2><p>${esc(f.desc)}</p>${gl('PLAY NOW!', { go: P.game(f.name), cls: 'orange' })}</div></div>`}
  <div class="rv ga-grid">${each(c.games, (g) => `<div class="ga-card">${lnk(P.game(g.name), '', { html: `<span class="ga-th">${scene(g.name)}${g.tag ? `<span class="ga-badge">${g.tag}</span>` : ''}</span>` })}${lnk(P.game(g.name), g.name, { cls: 'ga-n' })}<small>${stars(g.rating)} &middot; ${fmt(g.plays)} plays</small></div>`)}</div>
  <div class="rv ga-box"><h3>Top Players This Week</h3><ol>${each(c.top, (t) => `<li><b>${esc(t.user)}</b> - ${fmt(t.score)}</li>`)}</ol></div>
  <div class="rv ga-foot">&copy; 2012 Arcadeville &middot; Games require a working mouse, finger or nose</div>
</div></div>`;
  },
};

export const game = {
  gen(ctx) {
    const k = kit(ctx);
    const { r, say } = k;
    const name = ctx.hint.t || titleCase(deslug(ctx.params.slug));
    const mech = mechanicFor(name, hash(ctx.params.slug || name));
    const noun = (NOUNS.find((n) => name.toLowerCase().includes(n.toLowerCase())) || name.split(' ').find((w) => w.length > 3 && !/super|mega|turbo|ultra|crazy|cosmic|pixel|hyper|tiny|epic|catch|bonk|hungry|memory|match|panic|escape|copter|rocket|clicker|tycoon|empire|brick|bounce|bash|whack|flip|dodge/i.test(w)) || r.pick(NOUNS)).replace(/s$/, '');
    return {
      name,
      _mech: mech,
      noun,
      desc: say(r.pick(DESC)),
      howto: HOWTO[mech].replace(/\{noun\}/g, noun.toLowerCase()),
      plays: r.big(100, 5000000),
      rating: r.int(3, 5),
      sponsor: productName(r),
      more: list(6, (i) => gameFor(r.fork('m' + i)).name),
      comments: makeComments(r.fork('cm'), say, r.int(5, 9), { lines: ['my high score is {big}!!!', 'this game is so addicting', 'i should be doing homework lol', 'level {n} is impossible', 'best game on arcadeville', 'the music in this game is stuck in my head', 'beat my score: {big}'] }),
    };
  },
  title: (c) => `${c.name} - Play Free at Arcadeville`,
  render(c, ctx) {
    const root = `http://${HOSTS.games}/`;
    const hs = kv.get('hs:' + ctx.url, 0);
    return `<div class="pg games"><div class="ga-wrap">
  <div class="rv ga-head"><span class="ga-logo">${lnk(root, '', { html: 'Arcade<b>ville</b>' })}</span><span class="ga-tag">${lnk(root, '', { html: '&laquo; All games' })}</span></div>
  <h1 class="rv ga-title">${esc(c.name)}</h1>
  <div class="rv ga-meta">${stars(c.rating)} &middot; ${fmt(c.plays)} plays</div>
  <div class="rv gm-box" data-game>
    <div class="gm-stage"><canvas width="320" height="240" class="gm-c"></canvas><div class="gm-over"><div class="gm-load"><b>Loading game...</b><div class="gm-lb"><i></i></div><small>Sponsored by ${esc(c.sponsor)}</small></div></div></div>
    <div class="gm-hud">Score: <b class="gm-score">0</b> &middot; Your best: <b class="gm-hs">${fmt(hs)}</b></div>
  </div>
  <div class="rv ga-box"><h3>How to Play</h3><p>${esc(c.howto)}</p><p>${esc(c.desc)}</p></div>
  <div class="rv ga-box"><h3>Rate this game</h3><div class="ga-rate" data-rate>${[1, 2, 3, 4, 5].map((n) => `<button data-n="${n}" aria-label="${n} stars">&#9733;</button>`).join('')}</div></div>
  <div class="rv ga-box"><h3>More Games</h3><ul>${each(c.more, (m) => `<li>${lnk(P.game(m), m)}</li>`)}</ul></div>
  ${commentsBlock(c.comments, ctx, { flavor: 'game' })}
</div></div>`;
  },
  mount(el, c, ctx, api) {
    const box = el.querySelector('[data-game]');
    const canvas = box.querySelector('canvas');
    const over = box.querySelector('.gm-over');
    const scoreEl = box.querySelector('.gm-score');
    const hsEl = box.querySelector('.gm-hs');
    const r = new Rng(ctx.url);
    const pal = r.pick([['#1b1f3a', '#ff6f61', '#ffd166'], ['#0f3d2e', '#7bed9f', '#ffa502'], ['#2d1b3d', '#ff9ff3', '#48dbfb'], ['#102a43', '#f7b731', '#eb3b5a'], ['#222', '#0be881', '#ffdd59']]);
    const key = 'hs:' + ctx.url;
    let stop = null;
    const mech = c._mech || mechanicFor(c.name, hash(c.name));
    const fn = MECHANICS[mech] || MECHANICS.catcher;
    const start = () => {
      over.innerHTML = '';
      over.classList.add('off');
      api.sound('start');
      const seed = new Rng(ctx.url + Date.now());
      stop = fn(canvas, {
        r: seed, bg: pal[0], col: pal[1], col2: pal[2], noun: c.noun || 'Thing',
        sound: (n) => api.sound(n),
        score: (n) => { scoreEl.textContent = fmt(n); },
        load: () => kv.get('clk:' + ctx.url, null),
        save: (s) => kv.set('clk:' + ctx.url, s),
        over: (n) => {
          stop = null;
          const best = Math.max(n, kv.get(key, 0));
          const isNew = n > kv.get(key, 0);
          kv.set(key, best);
          hsEl.textContent = fmt(best);
          api.sound(isNew ? 'win' : 'lose');
          over.classList.remove('off');
          over.innerHTML = `<div class="gm-end"><b>GAME OVER</b><div>Score: ${fmt(n)}${isNew ? ' &mdash; NEW HIGH SCORE!' : ''}</div><button class="gl orange" data-play>Play Again</button> <button class="gl silver sm" data-submit>Submit Score</button></div>`;
        },
      });
    };
    over.addEventListener('click', (e) => {
      if (e.target.closest('[data-play]')) start();
      else if (e.target.closest('[data-submit]')) api.toast(`Score submitted! You are ranked #${fmt(1000 + Math.floor(Math.random() * 90000))} in the world.`);
    });
    // fake preloader, period-correct
    const bar = over.querySelector('.gm-lb i');
    let p = 0;
    const sp = { dialup: 0.25, dsl: 0.7, cable: 1.6 }[api.settings().speed] || 0.7;
    const iv = setInterval(() => {
      p = Math.min(1, p + (0.08 + Math.random() * 0.1) * sp);
      if (bar) bar.style.transform = `scaleX(${p})`;
      if (p >= 1) {
        clearInterval(iv);
        over.innerHTML = `<div class="gm-start">${gl('CLICK TO PLAY!', { cls: 'orange', act: 'go' })}</div>`;
        over.querySelector('[data-act="go"]').addEventListener('click', start);
      }
    }, 120);
    el.querySelector('[data-rate]')?.addEventListener('click', (e) => {
      const b = e.target.closest('[data-n]');
      if (!b) return;
      const n = +b.dataset.n;
      e.currentTarget.querySelectorAll('button').forEach((x) => x.classList.toggle('on', +x.dataset.n <= n));
      api.toast(`Thanks for rating! You gave it ${n} star${n > 1 ? 's' : ''}.`);
    });
    const unc = mountComments(el, ctx, api);
    return () => { clearInterval(iv); if (stop) stop(); unc(); };
  },
};


