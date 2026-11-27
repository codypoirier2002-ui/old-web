// Small built-in pages: personal homepages, errors, about: pages.
import { LEX } from '../core/lex.js';
import { sayer } from '../core/grammar.js';
import { site as siteLink, fanTopic, linkTo } from '../core/links.js';
import { HOME, searchUrl, registrable } from '../core/url.js';
import { deBrand } from '../core/site.js';
import { titleCase, deslug } from '../core/util.js';
import { esc, lnk, siteA, gl, each, paras } from '../render/html.js';
import { counter, construction, pic, marquee, hrRainbow, blink, badges } from '../render/widgets.js';
import { songTitle, bandName } from '../core/names.js';

// ---------- personal homepage ----------
const ABOUT = [
  'Hi! My name is {name} and this is my homepage on the World Wide Web. I am a {person} from {town}. In my spare time I enjoy {hobby} and {hobby2}.',
  'Welcome to my little corner of the internet! I made this page myself using a book from the library. I live in {town} with my {animal} named {pet}.',
  'Greetings, web surfer! You have found the official homepage of {name}. I like {food}, {hobby}, and long walks to {place}.',
];
const FACTS = ['My favorite color is {color}.', 'I once met a {animal} at {place}.', 'I can name all the {animal:s} in my neighborhood.', 'I have {n} {thing:s} and I am not ashamed.', 'My {animal} {pet} has his own homepage (coming soon!).', 'I learned HTML in one weekend. It shows!', 'My lucky number is {n}.', 'I am {pct}% sure aliens like {food}.'];

export const personal = {
  gen(ctx) {
    const r = ctx.r;
    const name = ctx.site.name.replace(/'s Homepage$/i, '') || titleCase(ctx.site.topic);
    const vars = { name, pet: r.pick(['Biscuit', 'Mr. Whiskers', 'Sir Fluffington', 'Pickles', 'Captain', 'Noodle', 'Peanut', 'Buster']), n: () => r.int(3, 99), pct: () => r.int(40, 99), hobby2: LEX.hobby };
    const say = sayer(r, LEX, vars);
    return {
      heading: `Welcome to ${name}'s Homepage!`,
      about: say(ABOUT),
      facts: r.sample(FACTS, 4).map((f) => say(f)),
      links: Array.from({ length: 4 }, (_, i) => {
        const s = siteLink(r.fork('l' + i).pick(['fan', 'blog', 'forum', 'personal', 'clan']), r.fork('lk' + i), fanTopic(r.fork('t' + i)));
        return { name: s.name, topic: s.topic, kind: s.kind };
      }),
      updated: `${r.int(1, 11)}/${r.int(1, 28)}/2012`,
      visitors: r.big(40, 9000),
      bg: r.pick(['#c0c0c0', '#008080', '#000080', '#ffffcc', '#ccffcc', '#e0e0ff', '#000']),
      song: r.chance(0.5) ? { title: songTitle(r), artist: bandName(r) } : { title: '', artist: '' },
    };
  },
  title: (c) => c.heading.replace(/!$/, ''),
  render(c, ctx) {
    const dark = ['#000080', '#008080', '#000'].includes(c.bg);
    return `<div class="pg personal" style="--bg:${c.bg};--fg:${dark ? '#fff' : '#000'};--link:${dark ? '#ffff00' : '#0000ee'}">
  <div class="ps-wrap">
    <h1 class="rv">${esc(c.heading)}</h1>
    <div class="rv">${marquee(`*** Last updated ${c.updated} *** Thanks for visiting! *** Please sign my guestbook (coming soon) ***`)}</div>
    <div class="rv">${construction()}</div>
    <div class="rv ps-about">${pic(ctx.url + 'me', { cls: 'ps-me', label: 'This is me!', subject: 'blob' })}<p>${esc(c.about)}</p></div>
    ${hrRainbow()}
    <h2 class="rv">Fun Facts About Me</h2>
    <ul class="rv">${each(c.facts, (f) => `<li>${esc(f)}</li>`)}</ul>
    <h2 class="rv">My Favorite Links</h2>
    <ul class="rv">${each(c.links, (l) => `<li>${siteA(linkTo(l.kind, l.topic, l.name))}</li>`)}</ul>
    <p class="rv">${lnk(ctx.root + 'pics.html', 'My Pictures')} | ${lnk(ctx.root + 'about.html', 'More About Me')} | ${lnk(ctx.root + 'links.html', 'Cool Links')} | <a data-act="mailto">Email Me!</a></p>
    ${hrRainbow()}
    ${c.song && c.song.title ? `<div class="rv ps-song" data-song="${esc(c.song.title)}|${esc(c.song.artist)}"></div>` : ''}
    <div class="rv ps-foot">You are visitor # ${counter(c.visitors, 'lcd')}${badges(ctx.r.fork('b'), 3)}<small>This page was made with Notepad. Best viewed with your eyes.</small><br>${lnk(HOME, 'Back to StartBlaster!')}</div>
  </div>
</div>`;
  },
  mount(el, c, ctx, api) {
    el.querySelectorAll('[data-act="mailto"]').forEach((a) => a.addEventListener('click', () => api.alert('Could not open your e-mail program. Please write my address on a piece of paper instead!')));
  },
};

export const personalSub = {
  gen(ctx) {
    const what = deslug(ctx.params.slug) || 'page';
    return { what: titleCase(what), pics: ctx.params.slug.startsWith('pic') };
  },
  title: (c, ctx) => `${c.what} - ${ctx.site.name}`,
  render(c, ctx) {
    const pics = c.pics ? `<div class="rv ps-pics">${[0, 1, 2, 3].map((i) => pic(ctx.url + i, { label: ['me at the beach', 'my room', 'my pet', 'a cool sunset'][i] })).join('')}</div>` : '';
    return `<div class="pg personal" style="--bg:#ffffcc;--fg:#000;--link:#0000ee"><div class="ps-wrap">
    <h1 class="rv">${esc(c.what)}</h1>
    ${pics}
    <div class="rv">${construction(c.pics ? 'MORE PICS COMING SOON' : 'THIS PAGE IS UNDER CONSTRUCTION')}</div>
    <p class="rv">Sorry, I am still working on this part. Check back soon! ${blink('Coming soon!')}</p>
    <p class="rv">${lnk(ctx.root, '<< Back to my homepage', { html: '&lt;&lt; Back to my homepage' })}</p>
  </div></div>`;
  },
};

// ---------- errors ----------
export const notFound = {
  gen: (ctx) => ({ path: ctx.params.path || ctx.p?.path || '/', host: ctx.p?.host || '' }),
  title: () => '404 Not Found',
  render(c, ctx) {
    return `<div class="pg e404">
<h1 class="rv">Not Found</h1>
<p class="rv">The requested URL ${esc(c.path)} was not found on this server.</p>
<p class="rv">Additionally, a 404 Not Found error was encountered while trying to use an ErrorDocument to handle the request.</p>
<hr class="rv"><address class="rv">WebServ/2.2.22 (Unix) Server at ${esc(c.host)} Port 80</address>
<p class="rv e404-help">${ctx.root ? lnk(ctx.root, 'Go to the front page of this site') + ' &middot; ' : ''}${lnk(HOME, 'StartBlaster! home')}</p>
</div>`;
  },
};

export const noServer = {
  gen(ctx) {
    const core = registrable(ctx.params.host || '');
    const r = ctx.r;
    const alt = [siteLink('fan', r.fork('a'), fanTopic(r.fork('b'))), siteLink('forum', r.fork('c')), siteLink('blog', r.fork('d'))];
    return { host: ctx.params.host, word: deBrand(core), alts: alt.map((s) => ({ name: s.name, url: s.url, topic: s.topic, kind: s.kind, site: s.site || '' })) };
  },
  title: () => 'Address Not Found',
  render(c) {
    return `<div class="pg neterr">
<div class="ne-box">
  <div class="ne-ico">!</div>
  <h1>Address Not Found</h1>
  <p>NetSkipper can't find the server at <b>${esc(c.host)}</b>.</p>
  <ul>
    <li>Check the address for typing errors such as <b>ww</b>.example.com instead of <b>www</b>.example.com</li>
    <li>If you are unable to load any pages, check your computer's network connection.</li>
    <li>If your computer is protected by a firewall, make sure NetSkipper is permitted to access the Web.</li>
  </ul>
  <p>${gl('Try Again', { act: 'reload', cls: 'silver' })}</p>
  <p class="ne-alt">Maybe you were looking for:</p>
  <ul>${each(c.alts, (a) => `<li>${siteA(a)}</li>`)}<li>${lnk(searchUrl(c.word), `Search Searchasaurus for "${c.word}"`)}</li></ul>
</div></div>`;
  },
};

// ---------- about: pages ----------
export const about = {
  gen: (ctx) => ({ name: ctx.params.name || 'blank' }),
  title: (c) => `about:${c.name}`,
  render(c) {
    if (c.name === 'blank') return '<div class="pg blank"></div>';
    if (c.name === 'netskipper' || c.name === 'version' || c.name === 'credits') {
      return `<div class="pg aboutpg"><div class="ab-box">
  <div class="ab-logo"><span class="throb big"></span><b>NetSkipper</b> <i>4.2</i></div>
  <p>Version 4.2.1 (Build 2012.11) &middot; Gold Edition</p>
  <p>The fastest way to skip around the Net. Now with tabs-ish!</p>
  <p class="fine">Pages on this internet are made up on the spot. Nothing here is real: every site, person, product, game and song is invented.</p>
  <p>${lnk(HOME, 'Go to StartBlaster!')}</p>
</div></div>`;
    }
    return `<div class="pg neterr"><div class="ne-box"><div class="ne-ico">?</div><h1>Page Not Available</h1><p>NetSkipper doesn't know about <b>about:${esc(c.name)}</b>.</p><p>${lnk('about:netskipper', 'about:netskipper')}</p></div></div>`;
  },
};

// ---------- portal info pages ----------
const INFO = {
  about: ['About StartBlaster!', 'StartBlaster! was founded in a garage in {town} by two friends and a very determined {animal}. Today we help over 40 million web surfers find what they are looking for, and some things they were not looking for at all.\n\nOur mission: put the whole Web on one page. We are about 0.0001% done.'],
  advertise: ['Advertise With Us', 'Reach millions of eyeballs! Our visitors love clicking on things. Banner ads start at just $9.99 per million impressions.\n\nAsk about our new Pop-Up Plus package, now with 30% more popping.'],
  privacy: ['Privacy Policy', 'We take your privacy very seriously. We do not sell your information. We do not even know what you are doing right now. (Are you eating a snack? That is fine.)\n\nCookies on this site are the chocolate chip kind.'],
};
export const portalInfo = {
  gen(ctx) {
    const [h, body] = INFO[ctx.params.slug] || INFO.about;
    const say = sayer(ctx.r, LEX, {});
    return { heading: h, body: say(body) };
  },
  title: (c) => `${c.heading} - StartBlaster!`,
  render(c) {
    return `<div class="pg portal"><div class="pt-wrap"><div class="rv pt-top"><div class="pt-logo"><span class="pt-rocket"></span><span class="pt-word">Start<b>Blaster</b><i>!</i></span></div></div>
<section class="rv box"><h2>${esc(c.heading)}</h2>${paras(c.body)}<p>${lnk(HOME, '', { html: '&laquo; Back to StartBlaster!' })}</p></section></div></div>`;
  },
};

