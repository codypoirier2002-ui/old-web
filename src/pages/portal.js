// StartBlaster! - the homepage portal. Built in (never AI) so it opens
// instantly; its stories rotate every day.
import { Rng } from '../core/rng.js';
import { LEX } from '../core/lex.js';
import { sayer } from '../core/grammar.js';
import { fakeToday, DAYS, MONTHS, fmt } from '../core/util.js';
import { HOSTS, searchUrl } from '../core/url.js';
import { site as siteLink, page as pageLink, fanTopic, forumTopic } from '../core/links.js';
import { miniGameName, songTitle } from '../core/names.js';
import { esc, lnk, siteA, gl, each } from '../render/html.js';
import { counter } from '../render/widgets.js';
import { kv } from '../browser/storage.js';

const HEADLINES = [
  'Local {person:title} Finds Missing {thing:title} {placeLost} After {n} Years',
  'Scientists Confirm {animal:s:title} Prefer {food:title} Over {food2:title}',
  '{town} Breaks World Record for Largest {thing:title}',
  'Study: {pct}% of People Have Never Seen a {thing:title} Up Close',
  '{animal:cap} Elected Honorary Mayor of {town}',
  'Forecasters Predict Outbreak of {weatherThing:title} This Weekend',
  'Man Teaches {animal:title} to Play the {instrument:title}; Neighbors "Mildly Impressed"',
  'New Study Links {hobby:title} to Being Slightly Happier',
  '{town} Council Votes {n}-{m} to Keep Giant {thing:title} Statue',
  '"{product}" Recalled After Units Found to Be Too Shiny',
  'Area Teen Beats {game} Using Only a {thing:title}',
  '{band} Announce Surprise Concert at {town} Bowling Alley',
  'Experts Warn: Your {thing:title} May Be Smarter Than You Think',
  '{town} Pie-Eating Contest Ends in {n}-Way Tie',
  'Missing {animal:title} Returns Home With a Tiny Hat',
  'Poll: {pct}% of Americans Say {food:title} Is "Basically a Sandwich"',
  '{person:title} Builds Working Rocket out of {thing:s:title}',
  'Internet Goes Wild Over Video of {animal:title} Riding a {thing:title}',
];
const BLURBS = [
  'Witnesses described the scene as "pretty great, honestly."',
  'Officials say there is no cause for alarm, only mild amazement.',
  'Experts are still scratching their heads over the whole thing.',
  'Locals have already started selling commemorative T-shirts.',
  '"I just did not see that coming," said one onlooker.',
  'The story has been forwarded over 2 million times.',
  'More updates are expected after lunch.',
];
const HOROSCOPE = [
  'Today is a great day to finally clean out your {thing}. You might find something wonderful.',
  'A mysterious stranger will offer you {food}. Accept.',
  'The stars say: avoid {animal:s} wearing sunglasses until Thursday.',
  'Your lucky number is {n}. Your lucky snack is {food}.',
  'Someone is thinking about you right now. Possibly about borrowing your {thing}.',
  'Big changes are coming! Probably to your hairstyle.',
  'Take a chance today. Try the {food} at the cafeteria.',
  'A forwarded email will change your life. Or at least your afternoon.',
];
const POLLS = [
  ['What is the best breakfast food?', ['Pancakes', 'Waffles', 'Cereal', 'Cold pizza']],
  ['Is a hot dog a sandwich?', ['Yes', 'No', 'It is its own thing', 'I am hungry now']],
  ['Best pet?', ['Hamster', 'Goldfish', 'Llama', 'Pet rock']],
  ['How do you get online?', ['Dial-up', 'DSL', 'Cable', 'My neighbor\'s Wi-Fi']],
  ['Which superpower would you pick?', ['Flying', 'Invisibility', 'Talking to animals', 'Infinite snacks']],
  ['Best day of the week?', ['Friday', 'Saturday', 'Pizza day', 'Every day is a good day']],
  ['Toilet paper: over or under?', ['Over', 'Under', 'Whatever is closest', 'I live in a tree']],
];
const QUERY_T = ['how to {verb} a {thing}', '{animal:s} in hats', 'funny {animal} pictures', 'best {food} recipe', '{band} lyrics', '{game} cheats', 'is {food} healthy', 'why is my {thing} beeping', '{thing} for sale', 'cute {animal:s}', 'free games', 'how to draw a {animal}', '{show} episode guide', 'world record {thing}', '{town} weather'];

const dayKey = () => { const d = fakeToday(); return `${d.getMonth() + 1}-${d.getDate()}`; };

export const ttl = () => { const d = new Date(); d.setHours(24, 0, 0, 0); return d.getTime(); };

export function gen() {
  const r = new Rng('portal:' + dayKey());
  const vars = {
    n: () => r.int(2, 40), m: () => r.int(0, 3), pct: () => r.int(12, 97),
    food2: LEX.food, product: LEX.invProduct, game: LEX.invGame, band: LEX.invBand, show: LEX.invShow,
  };
  const say = sayer(r, LEX, vars);
  const used = new Set();
  const stories = [];
  while (stories.length < 7) {
    const tpl = r.pick(HEADLINES);
    if (used.has(tpl)) continue;
    used.add(tpl);
    stories.push({ title: say(tpl), blurb: r.pick(BLURBS) });
  }
  const t = fakeToday();
  const poll = r.pick(POLLS);
  const cat = (label, kind, n, topicFn) => ({
    label, kind,
    links: Array.from({ length: n }, (_, i) => {
      const rr = r.fork(label + i);
      const s = siteLink(kind, rr, topicFn ? topicFn(rr) : undefined);
      return { name: s.name, url: s.url, topic: s.topic, kind: s.kind, site: s.site || '' };
    }),
  });
  const dir = [
    cat('Fan Pages', 'fan', 3),
    cat('Message Boards', 'forum', 3, forumTopic),
    cat('Blogs', 'blog', 3),
    cat('Gaming Clans', 'clan', 2),
    cat('Trickshot Montages', 'trickshot', 2),
    cat('Personal Homepages', 'personal', 2),
  ];
  const videos = Array.from({ length: 3 }, (_, i) => say(['{animal:cap} vs {thing:title} (ORIGINAL)', 'my {animal} tries {food} for the first time!!', 'EPIC {thing} FAIL compilation', '{band} - {song} (official video)', 'how 2 {verb} a {thing} HD'], { song: songTitle(r.fork('v' + i)) }));
  const games = Array.from({ length: 3 }, (_, i) => miniGameName(r.fork('g' + i)));
  const guides = Array.from({ length: 3 }, () => say(['How to {verb} a {thing}', 'How to Teach Your {animal:title} to Sit', 'How to Make {food:title} in 5 Minutes', 'How to Win at {game}', 'How to Fold a Fitted Sheet']));
  const rooms = r.sample(['The Lobby', 'Gamers Den', 'Music Lounge', 'Homework Help', 'Random Chat', 'Pet Lovers', 'Night Owls', 'Snack Talk'], 3);
  const coolKind = r.pick(['fan', 'blog', 'forum', 'personal']);
  const cool = siteLink(coolKind, r.fork('cool'), coolKind === 'forum' ? forumTopic(r) : fanTopic(r));
  return {
    date: `${DAYS[t.getDay()]}, ${MONTHS[t.getMonth()]} ${t.getDate()}, ${t.getFullYear()}`,
    stories,
    weather: { town: r.pick(LEX.town), temp: r.int(28, 88), cond: r.pick(LEX.weather), hi: r.int(40, 90), lo: r.int(20, 50) },
    horoscope: { sign: r.pick(LEX.zodiac), text: say(r.pick(HOROSCOPE), { n: r.int(1, 99) }) },
    poll: { q: poll[0], opts: poll[1], votes: poll[1].map(() => r.int(40, 900)) },
    cool: { name: cool.name, url: cool.url, topic: cool.topic, kind: cool.kind, site: cool.site || '', blurb: say(['A totally {adj} site all about {topic}. Must see!!', 'Everything you ever wanted to know about {topic}, and more!', 'We laughed, we cried, we bookmarked it.'], { topic: cool.topic }) },
    hot: Array.from({ length: 6 }, () => say(QUERY_T, { band: LEX.invBand, game: LEX.invGame, show: LEX.invShow })),
    dir,
    videos, games, guides, rooms,
    visitors: 4000000 + r.int(0, 900000),
  };
}

export const title = () => 'StartBlaster! - Your Launchpad to the Web';

const TABS = [
  ['Home', `http://${HOSTS.portal}/`],
  ['Mail', `http://${HOSTS.mail}/`],
  ['Search', `http://${HOSTS.search}/`],
  ['Videos', `http://${HOSTS.video}/`],
  ['Games', `http://${HOSTS.games}/`],
  ['Chat', `http://${HOSTS.chat}/`],
  ['How-To', `http://${HOSTS.howto}/`],
  ['News', `http://${HOSTS.news}/`],
];

export function render(c) {
  const pollKey = 'poll:' + c.poll.q;
  const voted = kv.get(pollKey, null);
  return `<div class="pg portal">
  <div class="pt-wrap">
  <div class="rv pt-top">
    <div class="pt-logo"><span class="pt-rocket"></span><span class="pt-word">Start<b>Blaster</b><i>!</i></span></div>
    <div class="pt-date">${esc(c.date)}<br><small>Welcome, Guest! ${lnk(`http://${HOSTS.mail}/`, 'Check your mail')}</small></div>
  </div>
  <nav class="rv pt-tabs">${TABS.map(([n, u], i) => lnk(u, n, { cls: i === 0 ? 'on' : '' })).join('')}</nav>
  <form class="rv pt-search" data-search="${esc(searchUrl(''))}">
    <input name="q" type="search" placeholder="Search the Web..." autocomplete="off" autocapitalize="off" enterkeyhint="search">
    ${gl('Search', { type: 'submit', cls: 'orange' })}
    <div class="pt-hot"><b>Hot searches:</b> ${c.hot.map((q) => lnk(searchUrl(q), q)).join(' &middot; ')}</div>
  </form>
  <div class="pt-cols">
    <div class="pt-main">
      <section class="rv box">
        <h2><span class="ico">&#9733;</span> Today's Top Stories</h2>
        <ul class="pt-news">${each(c.stories, (s, i) => `<li${i === 0 ? ' class="lead"' : ''}>${lnk(pageLink.story(s.title), s.title)}${i === 0 ? `<p>${esc(s.blurb)}</p>` : ''}</li>`)}</ul>
        <div class="more">${lnk(`http://${HOSTS.news}/`, '', { html: 'More news &raquo;' })}</div>
      </section>
      <section class="rv box">
        <h2><span class="ico">&#10070;</span> Explore the Web</h2>
        <div class="pt-dir">${each(c.dir, (d) => `<div class="cat"><h3>${esc(d.label)}</h3><ul>${each(d.links, (l) => `<li>${siteA(l)}</li>`)}</ul></div>`)}
          <div class="cat"><h3>Videos</h3><ul>${each(c.videos, (v) => `<li>${lnk(pageLink.watch(v), v)}</li>`)}</ul></div>
          <div class="cat"><h3>Free Games</h3><ul>${each(c.games, (g) => `<li>${lnk(pageLink.game(g), g)}</li>`)}</ul></div>
          <div class="cat"><h3>How-To</h3><ul>${each(c.guides, (g) => `<li>${lnk(pageLink.guide(g), g)}</li>`)}</ul></div>
          <div class="cat"><h3>Chat Rooms</h3><ul>${each(c.rooms, (g) => `<li>${lnk(pageLink.room(g), g)}</li>`)}</ul></div>
        </div>
      </section>
    </div>
    <div class="pt-side">
      <section class="rv box wx">
        <h2>Weather</h2>
        <div class="wx-b"><span class="wx-ico"></span><div><b>${c.weather.temp}&deg;F</b> ${esc(c.weather.cond)}<br><small>${esc(c.weather.town)} &middot; Hi ${c.weather.hi}&deg; Lo ${c.weather.lo}&deg;</small></div></div>
      </section>
      <section class="rv box">
        <h2>Horoscope</h2>
        <p><b>${esc(c.horoscope.sign)}:</b> ${esc(c.horoscope.text)}</p>
      </section>
      <section class="rv box poll" data-poll="${esc(pollKey)}">
        <h2>Quick Poll</h2>
        <p><b>${esc(c.poll.q)}</b></p>
        ${voted == null
    ? c.poll.opts.map((o, i) => `<button class="poll-opt" data-act="vote" data-i="${i}">${esc(o)}</button>`).join('')
    : pollResults(c.poll, voted)}
      </section>
      <section class="rv box cool">
        <h2>Cool Site of the Day</h2>
        <p>${siteA(c.cool, null, { cls: 'big' })}<br>${esc(c.cool.blurb)}</p>
      </section>
    </div>
  </div>
  <div class="rv pt-foot">
    <p>${gl('Make StartBlaster! your homepage', { act: 'homepage', cls: 'silver' })}</p>
    <p>${lnk(`http://${HOSTS.portal}/about`, 'About Us')} | ${lnk(`http://${HOSTS.portal}/advertise`, 'Advertise')} | ${lnk(`http://${HOSTS.portal}/privacy`, 'Privacy Policy')} | ${lnk(`http://${HOSTS.freehost}/`, 'Free Homepages')}</p>
    <div>You are visitor number ${counter(c.visitors)}</div>
    <p class="fine">&copy; 2012 StartBlaster Inc. All rights reserved. Best viewed at 1024x768.</p>
  </div>
  </div>
</div>`;
}

function pollResults(poll, voted) {
  const votes = poll.votes.map((v, i) => v + (i === voted ? 1 : 0));
  const total = votes.reduce((a, b) => a + b, 0);
  return `<div class="poll-res">${poll.opts.map((o, i) => {
    const pct = Math.round((votes[i] / total) * 100);
    return `<div class="pr${i === voted ? ' me' : ''}"><span>${esc(o)}</span><div class="pbar"><i style="width:${pct}%"></i></div><small>${pct}%</small></div>`;
  }).join('')}<small>${fmt(total)} votes</small></div>`;
}

export function mount(el, c, ctx, api) {
  const poll = el.querySelector('.poll');
  if (poll) {
    poll.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act="vote"]');
      if (!b) return;
      const i = +b.dataset.i;
      kv.set(poll.dataset.poll, i);
      api.sound('click');
      b.parentElement.querySelectorAll('.poll-opt').forEach((x) => x.remove());
      poll.insertAdjacentHTML('beforeend', pollResults(c.poll, i));
    });
  }
  const hp = el.querySelector('[data-act="homepage"]');
  if (hp) hp.addEventListener('click', () => api.toast('StartBlaster! is already your homepage. Good choice!'));
}

