// Hidden pages. If you are reading this, you are spoiling it for yourself!
import { kv } from '../browser/storage.js';
import { petRock } from '../browser/eggs.js';
import { esc, lnk, gl, each } from '../render/html.js';
import { counter, scene } from '../render/widgets.js';
import { HOME, searchUrl } from '../core/url.js';
import { LEX } from '../core/lex.js';
import { username } from '../core/names.js';
import { list } from './common.js';

export const EGG_HOSTS = {
  'www.totallyrealprizes.biz': 'prize',
  'www.hidden-clubhouse.net': 'clubhouse',
  localhost: 'homeSweetHome',
  '127.0.0.1': 'homeSweetHome',
};

const ROCK_NAMES = ['Rocky', 'Pebbles', 'Sir Stoney', 'Gravel McGee', 'Boulder Jr.', 'Rockwell', 'Mr. Pebbleton', 'Slate'];

export const prize = {
  gen(ctx) {
    return { name: ctx.r.pick(ROCK_NAMES), claimed: ctx.r.int(1, 9) };
  },
  title: () => 'YOU ARE A WINNER!!!',
  render(c) {
    const have = kv.get('petrock', null);
    return `<div class="pg shop"><div class="sh-wrap">
  <div class="rv sh-burst">WINNER!</div>
  <h1 class="rv sh-name">CONGRATULATIONS!!!</h1>
  <div class="rv sh-tag">You are our 1,000,000th visitor!</div>
  <div class="rv sh-pitch"><p>Your FREE prize is a genuine, hand-picked, one-of-a-kind...</p><div class="rock-big"></div><p><b>PET ROCK</b> named <b>${esc(have ? have.name : c.name)}</b>!</p><p>No feeding. No walking. No batteries. 100% rock.</p></div>
  <div class="rv sh-order">${have ? `<b>${esc(have.name)} already lives with you.</b><small>Look for it at the bottom of your browser.</small>` : `<b>CLAIM YOUR PRIZE!</b>${gl('ADOPT MY PET ROCK', { act: 'adopt', cls: 'red' })}<small>Offer valid while rocks last.</small>`}</div>
  <div class="rv sh-foot">This is a totally real prize. ${lnk(HOME, 'Back to StartBlaster!')}</div>
</div></div>`;
  },
  mount(el, c, ctx, api) {
    el.querySelector('[data-act="adopt"]')?.addEventListener('click', (e) => {
      kv.set('petrock', { name: c.name, t: Date.now() });
      petRock(api.browser);
      api.sound('win');
      e.currentTarget.replaceWith(Object.assign(document.createElement('small'), { textContent: `${c.name} has moved into your status bar. Say hi!` }));
    });
  },
};

export const clubhouse = {
  gen(ctx) {
    const r = ctx.r;
    return { members: list(9, (i) => username(r.fork('m' + i))), password: r.pick(['banana', 'swordfish', 'open sesame', 'pickles']) };
  },
  title: () => 'Hidden Clubhouse - Members Only!!!',
  render(c) {
    const finds = kv.get('clubFound', 0);
    return `<div class="pg fan bgp-stars" style="--bg:#120024;--fg:#e6d6ff;--link:#ffe600;--acc:#ff3cac;--h:#7df9ff;--font:'Courier New',monospace;--hfont:Impact,'Arial Black',sans-serif">
  <div class="fan-wrap">
  <div class="rv fan-top"><h1 class="fan-h">~ THE HIDDEN CLUBHOUSE ~</h1></div>
  <p class="rv fan-intro">You found it. Not many people do. Welcome, new member #${(1337 + finds).toLocaleString('en-US')}!</p>
  <div class="rv fan-box"><h2>Members Who Found It</h2><ol>${each(c.members, (m) => `<li>${esc(m)}</li>`)}<li><b>YOU!</b></li></ol></div>
  <div class="rv fan-box"><h2>Do the Secret Handshake</h2><p>Up, up, down, down... with buttons.</p><p class="hs">${gl('UP', { act: 'hs-u', cls: 'sm' })} ${gl('DOWN', { act: 'hs-d', cls: 'sm' })} ${gl('WIGGLE', { act: 'hs-w', cls: 'sm pink' })}</p><p class="hs-out">&nbsp;</p></div>
  <div class="rv fan-box"><h2>Club Rules</h2><ol><li>Don't tell anyone about the clubhouse.</li><li>Seriously.</li><li>OK maybe tell one friend.</li><li>Members get to try ${lnk('about:hidden', 'the hidden about page')}.</li></ol></div>
  <div class="rv fan-foot">${counter(1337 + finds, 'led')}<br>${lnk(HOME, 'Leave quietly')}</div>
  </div></div>`;
  },
  mount(el, c, ctx, api) {
    kv.set('clubFound', kv.get('clubFound', 0) + 1);
    let seq = '';
    el.querySelector('.hs')?.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      seq = (seq + b.dataset.act.slice(3)).slice(-5);
      api.sound('blip');
      const out = el.querySelector('.hs-out');
      out.textContent = seq.split('').map((x) => ({ u: '↑', d: '↓', w: '~' }[x])).join(' ');
      if (seq === 'uuddw') { out.textContent = `Handshake accepted! The password is "${c.password}". (It does not open anything.)`; api.sound('win'); }
    });
  },
};

export const homeSweetHome = {
  gen: () => ({}),
  title: () => 'There\'s No Place Like 127.0.0.1',
  render() {
    return `<div class="pg personal" style="--bg:#fffbe6;--fg:#333;--link:#c0392b"><div class="ps-wrap">
  <h1 class="rv">There's no place like 127.0.0.1</h1>
  <div class="rv" style="text-align:center">${scene('home-sweet-home', { subject: 'heart', caption: 'HOME SWEET HOME' })}</div>
  <p class="rv">You have reached your very own computer. It looks lovely from in here. Have you dusted the keyboard lately?</p>
  <ul class="rv"><li>Files found: ${LEX.thing.length} mysterious ones</li><li>Snacks found: 0 (concerning)</li><li>Hamsters in the hard drive: probably none</li></ul>
  <p class="rv">${lnk(HOME, 'Go back out onto the Web')} &middot; ${lnk(searchUrl('how to clean a keyboard'), 'How to clean a keyboard')}</p>
</div></div>`;
  },
};

export const HIDDEN_ABOUT = `<div class="pg aboutpg"><div class="ab-box">
  <div class="ab-logo"><span class="throb big"></span><b>about:hidden</b></div>
  <p>You found the hidden page. Here is what NetSkipper knows:</p>
  <ul style="text-align:left">
    <li>The spinning logo in the corner likes being tapped. A lot.</li>
    <li>Hit counters can only count so high.</li>
    <li>Some searches do more than search.</li>
    <li>There's no place like home. Try typing it.</li>
    <li>Pop-ups are annoying, except the lucky ones.</li>
    <li>Not every window button behaves.</li>
  </ul>
  <p>${lnk(HOME, 'Back to StartBlaster!')}</p>
</div></div>`;
