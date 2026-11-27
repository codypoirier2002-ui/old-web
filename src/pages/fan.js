// Glittery fan pages on the free host: main page, guestbook, links, subpages.
import { LEX } from '../core/lex.js';
import { fmt, titleCase, deslug } from '../core/util.js';
import { Rng } from '../core/rng.js';
import { esc, lnk, siteA, gl, each, paras } from '../render/html.js';
import { counter, construction, pic, marquee, hrRainbow, blink, newBadge } from '../render/widgets.js';
import { theme, vars } from '../render/theme.js';
import { site as siteLink, fanTopic, page as P, linkTo } from '../core/links.js';
import { kit, list, username, songTitle, bandName, dateOnly } from './common.js';
import { kv } from '../browser/storage.js';

const HEAD = ['~*~ Welcome 2 My {Topic} Fan Page!!! ~*~', '*~* {Topic} 4 Ever *~*', '~~ The Ultimate {Topic} Shrine ~~', '.:: {Topic} Paradise ::.', '{Topic} Rulez!!!', 'xX {Topic} Fan Club Xx', '~*~ I <3 {Topic} ~*~'];
const INTRO = [
  'Hi!!! Welcome to the BEST {topic} site on the WHOLE INTERNET!!! I made this site because I love {topic} SO MUCH. Look around and sign my guestbook before u leave!!!',
  'OMG hi!! :D You found my {topic} page!! This site is dedicated to {topic}, the most {adj} thing in the universe. Enjoy ur stay!!!',
  'Welcome, fellow {topic} fan!! This page has pics, facts, a quiz and MORE. It is always updating so come back a lot!!',
];
const REASONS = [
  'Nothing in the world beats {topic}!!', '{Topic}: 100% awesome, 0% boring', 'Life without {topic}? No thank u!', 'Everyone who loves {topic} is automatically cool',
  'My {pet2} loves {topic} too (I can tell)', 'You can\'t spell AWESOME without... ok you can, but still', 'I think about {topic} like {n} times a day', '{Topic} and {food}. Best. Combo. Ever.',
  'When I\'m sad I just think about {topic} :)', 'My best friend and I talk about {topic} at recess every day', '{Topic} is better than homework (obviously)', 'It is impossible to be grumpy around {topic}',
  'There are {big} {topic} fans on the internet and they are all nice', '{Topic} was in my dream once and it was the best dream', 'Even my {person} likes {topic} now', 'Because {topic} is just {adj}. Duh.',
];
const FACTS = [
  'Did u know? Fans of {topic} are {pct}% happier (I made a survey).', 'The first {topic} fan club started in {town} in 19{yy}. (I think)', 'Some people say {topic} is overrated. Those people are WRONG.',
  'You can find {topic} stuff at {place} if u look really hard.', '{Topic} has been around for at least {n} years. Probably more.', 'If u say {topic} 3 times in the mirror nothing happens. I tried.',
  'My cousin met someone who knows someone who likes {topic}.', '{pct}% of this website is about {topic}. The other part is about {food}.',
];
const NEWS = ['Added {n} new pics!!', 'Fixed the guestbook (sorry it was broken!!)', 'New quiz is up!!! Take it!!', 'Site is 1 year old today!!! Thanks 4 visiting', 'Updated the links page', 'Changed the background, do u like it??', 'Won another award!!! :D', 'Added music! (turn ur speakers on)'];
const AWARDS = ['Cool Site Award', 'Golden Glitter 2012', 'Top 100 Fan Sites', 'Webmaster\'s Choice', 'Sparkle Seal of Approval', 'Best Background 2011'];
const QUIZ = [
  ['How much do u love {topic}?', ['A little', 'A lot', 'SO MUCH', 'More than {food}']],
  ['Where would u take {topic} on vacation?', ['The beach', '{town}', 'The moon', 'My room']],
  ['Pick a color for {topic}:', ['Pink', 'Blue', 'Glitter', 'All of them']],
];
const GB = [
  'OMG ur site is sooo cool!!! I love {topic} too!!!', 'great site!! visit mine too!! :)', 'hi from {town}!! nice background lol', 'i luv {topic}!!!! <3 <3 <3',
  'this is the best {topic} site ever made!!!', 'cool pics. how did u make the sparkles??', 'just stopping by to say hi!! keep up the good work', 'i added u to my links page!!',
  '{topic} 4 ever!!!!!!!', 'ur site made my day :D', 'can u make a page about {food} next??', 'wow how long did this take u to make?', 'signing ur guestbook like u asked lol',
];

function fanKit(ctx) {
  return kit(ctx, { person: LEX.person, pet2: ['hamster', 'goldfish', 'cat', 'dog', 'turtle', 'bunny'], yy: () => String(new Rng(ctx.url).int(50, 99)) });
}

function sparkles(seed, n = 7) {
  const r = new Rng('sp:' + seed);
  return `<div class="sparkles" aria-hidden="true">${list(n, () => `<i style="left:${r.int(2, 96)}%;top:${r.int(5, 90)}%;animation-delay:${(r.next() * 2).toFixed(2)}s;--s:${(0.6 + r.next() * 0.9).toFixed(2)}"></i>`).join('')}</div>`;
}

function shell(ctx, inner, c) {
  const th = theme(ctx.site);
  return `<div class="pg fan bgp-${th.pat}" style="${vars(th)}">
  <div class="fan-wrap">${inner}
  <div class="rv fan-nav">${lnk(ctx.root, 'Home')} | ${lnk(P.sub(ctx.root, 'pics'), 'Pics')} | ${lnk(P.sub(ctx.root, 'facts'), 'Facts')} | ${lnk(P.sub(ctx.root, 'quiz'), 'Quiz')} | ${lnk(ctx.root + 'guestbook.html', 'Guestbook')} | ${lnk(ctx.root + 'links.html', 'Links')}</div>
  <div class="rv fan-foot">${c && c.visitors ? `You are visitor #${counter(c.visitors, ctx.r.pick(['odo', 'lcd', 'led']))}<br>` : ''}<small>This site is best viewed at 800x600 with ur speakers ON!!<br>&copy; 2012 ${esc(c && c.owner ? c.owner : ctx.site.name)}. Do not steal my graphics!!!</small></div>
  </div></div>`;
}

export const fan = {
  gen(ctx) {
    const { r, say } = fanKit(ctx);
    return {
      heading: say(HEAD),
      intro: say(INTRO),
      owner: username(r.fork('own')),
      updated: dateOnly(r.int(0, 40)),
      news: list(3, (i) => ({ date: dateOnly(i * r.int(3, 20)), text: say(r.pick(NEWS)) })),
      about: say(['{Topic} is my favorite thing in the whole world. I first found out about {topic} when I was at {place} and it changed my life forever!!! Now I have {n} posters on my wall.', 'So what is so great about {topic}? EVERYTHING. I could talk about {topic} all day. Actually I do. Just ask my {person}.']),
      reasons: r.sample(REASONS, 10).map((x) => say(x)),
      pics: list(4, () => say(['me and {topic}!!', '{topic} pic #{n}', 'sooo cute', 'my fav pic', 'from my trip', 'drew this myself'])),
      awards: r.sample(AWARDS, 3),
      song: { title: songTitle(r), artist: bandName(r) },
      visitors: r.big(80, 99999),
      construction: r.chance(0.4),
    };
  },
  title: (c) => c.heading.replace(/[~*.:x]+/gi, ' ').replace(/\s+/g, ' ').trim(),
  render(c, ctx) {
    return shell(ctx, `
  <div class="rv fan-top">${sparkles(ctx.url)}<h1 class="fan-h">${esc(c.heading)}</h1>${marquee(`*~*~* Last updated: ${c.updated} *~*~* Welcome to my site!!! Sign my guestbook!!! *~*~*`)}</div>
  <p class="rv fan-intro">${esc(c.intro)}</p>
  ${c.construction ? `<div class="rv">${construction()}</div>` : ''}
  <div class="rv fan-box"><h2>${newBadge()} Updates</h2><ul>${each(c.news, (n) => `<li><b>${esc(n.date)}:</b> ${esc(n.text)}</li>`)}</ul></div>
  ${hrRainbow()}
  <div class="rv fan-box"><h2>About ${esc(ctx.site.topic)}</h2>${paras(c.about)}</div>
  <div class="rv fan-pics">${each(c.pics, (p, i) => pic(ctx.url + 'p' + i, { label: p }))}</div>
  <div class="rv fan-box"><h2>Top 10 Reasons Why ${esc(titleCase(ctx.site.topic))} Rocks</h2><ol>${each(c.reasons, (x) => `<li>${esc(x)}</li>`)}</ol></div>
  ${hrRainbow()}
  <div class="rv fan-box fan-awards"><h2>Awards This Site Has Won!!!</h2><div>${each(c.awards, (a) => `<span class="award"><b>${esc(a)}</b></span>`)}</div></div>
  <div class="rv fan-song" data-song="${esc(c.song.title)}|${esc(c.song.artist)}"></div>
  <p class="rv fan-gb">${blink('>>>')} ${lnk(ctx.root + 'guestbook.html', 'SIGN MY GUESTBOOK!!!')} ${blink('<<<')}</p>`, c);
  },
};

export const guestbook = {
  gen(ctx) {
    const { r, say } = fanKit(ctx);
    return {
      owner: username(r.fork('own')),
      entries: list(r.int(6, 11), (i) => {
        const rr = r.fork('g' + i);
        return { name: username(rr), from: rr.pick(LEX.town), msg: say(rr.pick(GB)), date: dateOnly(i * rr.int(2, 12)) };
      }),
    };
  },
  title: (c, ctx) => `Guestbook - ${ctx.site.name}`,
  render(c, ctx) {
    const mine = ((ctx.state && ctx.state.entries) || []).slice().reverse();
    const row = (e, me) => `<div class="gb-e${me ? ' me' : ''}"><div class="gb-h"><b>${esc(e.name)}</b> from ${esc(e.from)} <small>${esc(e.date)}</small></div><div>${esc(e.msg)}</div></div>`;
    return shell(ctx, `
  <div class="rv fan-top">${sparkles(ctx.url, 5)}<h1 class="fan-h">~*~ Guestbook ~*~</h1></div>
  <p class="rv fan-intro">Thank u for visiting!!! Please sign my guestbook and tell me what u think!!! No mean comments plz :)</p>
  <form class="rv gb-form" data-gb>
    <label>Name: <input name="name" maxlength="30" required></label>
    <label>Where r u from? <input name="from" maxlength="30"></label>
    <label>Message:<textarea name="msg" rows="3" maxlength="300" required></textarea></label>
    ${gl('Sign Guestbook!', { type: 'submit', cls: 'pink' })}
  </form>
  <div class="rv gb-list">${mine.map((e) => row(e, true)).join('')}${each(c.entries, (e) => row(e))}</div>`, { owner: c.owner, visitors: 0 });
  },
  mount(el, c, ctx, api) {
    const form = el.querySelector('[data-gb]');
    const nick = kv.get('nick', '');
    if (nick) form.name.value = nick;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const entry = { name: form.name.value.trim().slice(0, 30) || 'Guest', from: form.from.value.trim().slice(0, 30) || 'the Internet', msg: form.msg.value.trim().slice(0, 300), date: 'just now' };
      if (!entry.msg) return;
      kv.set('nick', entry.name);
      const entries = (api.state().entries || []).concat(entry).slice(-40);
      api.save({ entries });
      el.querySelector('.gb-list').insertAdjacentHTML('afterbegin', `<div class="gb-e me"><div class="gb-h"><b>${esc(entry.name)}</b> from ${esc(entry.from)} <small>just now</small></div><div>${esc(entry.msg)}</div></div>`);
      form.msg.value = '';
      api.sound('ding');
      api.alert('Thank u for signing my guestbook!!! :D', 'Guestbook');
    });
  },
};

export const links = {
  gen(ctx) {
    const { r } = fanKit(ctx);
    const friends = list(8, (i) => {
      const s = siteLink('fan', r.fork('f' + i), fanTopic(r.fork('t' + i)));
      return { name: s.name, topic: s.topic, blurb: r.fork('b' + i).pick(['soooo cool', 'my best friend\'s site!!', 'great pics', 'lots of info', 'check it out!!', 'very sparkly', 'NEW!!']) };
    });
    return { ring: `The ${titleCase(ctx.site.topic)} Webring`, friends };
  },
  title: (c, ctx) => `Links - ${ctx.site.name}`,
  render(c, ctx) {
    const ring = c.friends.map((f) => ({ ...linkTo('fan', f.topic, f.name), blurb: f.blurb }));
    return shell(ctx, `
  <div class="rv fan-top">${sparkles(ctx.url, 5)}<h1 class="fan-h">~*~ Cool Links ~*~</h1></div>
  <div class="rv fan-box"><h2>My Friends' Sites</h2><ul>${each(ring, (f) => `<li>${siteA(f)} - ${esc(f.blurb)}</li>`)}</ul></div>
  <div class="rv fan-box"><h2>Link 2 Me!!</h2><p>Copy this code and put it on ur site:</p><textarea class="code" rows="3" readonly>&lt;a href="${esc(ctx.url.replace(/links\.html$/, ''))}"&gt;&lt;img src="mybutton.gif"&gt;&lt;/a&gt;</textarea></div>
  <div class="rv webring"><b>${esc(c.ring)}</b><br>${siteA(ring[0], '<< Prev', { html: '&lt;&lt; Prev' })} | ${siteA(ring[3 % ring.length], 'Random')} | ${siteA(ring[1 % ring.length], 'Next >>', { html: 'Next &gt;&gt;' })}</div>`, { visitors: 0 });
  },
};

export const fanSub = {
  gen(ctx) {
    const { r, say } = fanKit(ctx);
    const s = (ctx.params.slug || '').replace(/\.html?$/, '');
    const kindOf = /pic|photo|gallery|img/.test(s) ? 'pics' : /fact|info|trivia/.test(s) ? 'facts' : /quiz|test/.test(s) ? 'quiz' : /about|me|bio/.test(s) ? 'about' : 'more';
    const q = r.pick(QUIZ);
    return {
      heading: ctx.hint.t && ctx.hint.t.length < 40 ? ctx.hint.t : titleCase(deslug(s)),
      sub: kindOf,
      text: say(kindOf === 'about' ? ['Hi!!! I\'m the webmaster of this site. I\'m {n} years old (jk I won\'t tell u). I like {topic}, {food}, and {hobby}. My favorite band is {band}. Email me!!!'] : ['Here is even MORE stuff about {topic}!!! I worked really hard on this page so I hope u like it.', 'This page is all about {topic}. If u have more stuff 2 add, sign my guestbook!!']),
      facts: r.sample(FACTS, 6).map((f) => say(f)),
      pics: list(6, () => say(['{topic}!!', 'sooo cute', 'pic #{n}', 'my fav', 'lol', 'awww'])),
      quiz: { q: say(q[0]), opts: q[1].map((o) => say(o)) },
    };
  },
  title: (c, ctx) => `${c.heading} - ${ctx.site.name}`,
  render(c, ctx) {
    let body = '';
    if (c.sub === 'pics') body = `<div class="rv fan-pics six">${each(c.pics, (p, i) => pic(ctx.url + i, { label: p }))}</div>`;
    else if (c.sub === 'facts') body = `<div class="rv fan-box"><h2>${esc(titleCase(ctx.site.topic))} Facts!!</h2><ul>${each(c.facts, (f) => `<li>${esc(f)}</li>`)}</ul></div>`;
    else if (c.sub === 'quiz') body = `<div class="rv fan-box quiz"><h2>Are U a True Fan? Take the Quiz!</h2><p><b>${esc(c.quiz.q)}</b></p>${each(c.quiz.opts, (o) => `<button class="gl sm pink" data-act="quiz">${esc(o)}</button> `)}<p class="quiz-res"></p></div>`;
    else body = `<div class="rv fan-box">${paras(c.text)}</div><div class="rv fan-pics">${each(c.pics.slice(0, 2), (p, i) => pic(ctx.url + i, { label: p }))}</div>`;
    return shell(ctx, `<div class="rv fan-top">${sparkles(ctx.url, 5)}<h1 class="fan-h">~*~ ${esc(c.heading)} ~*~</h1></div>${body}`, { visitors: 0 });
  },
  mount(el, c, ctx, api) {
    el.querySelectorAll('[data-act="quiz"]').forEach((b) => b.addEventListener('click', () => {
      el.querySelector('.quiz-res').innerHTML = `<b>RESULT:</b> You are a TRUE ${esc(ctx.site.topic.toUpperCase())} FAN!!! Copy this badge to ur site!!! &#9733;`;
      api.sound('ding');
    }));
  },
};

void fmt;
