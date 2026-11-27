// Blogs (on blogaroo.com and elsewhere) and the StartBlaster news desk.
import { LEX } from '../core/lex.js';
import { HOSTS, HOME } from '../core/url.js';
import { fmt, titleCase, deslug, cap, daysAgo, fmtDate, MONTHS, fmtTime } from '../core/util.js';
import { Rng } from '../core/rng.js';
import { esc, lnk, siteA, gl, each, paras } from '../render/html.js';
import { counter, avatar, pic, banner } from '../render/widgets.js';
import { commentsBlock, mountComments } from '../render/comments.js';
import { theme, vars } from '../render/theme.js';
import { site as siteLink, fanTopic, page as P, linkTo } from '../core/links.js';
import { kit, list, username, songTitle, bandName, makeComments, productName, personName } from './common.js';

const POST_T = [
  'So today I {event}', '{n} things I learned this week', 'Rant: why is {thing} so {adj}??', 'My weekend at {place}', 'Update!! (sorry I haven\'t posted)', 'I finally tried {food}',
  'Thoughts on {topic}', 'Back from {place}!', 'New hobby: {hobby}', 'Things that made me happy today', 'Dear {thing}, we need to talk', 'Is it just me or is {food} better cold?',
  'My {animal} did the funniest thing', 'Top 5 {thing:s} of all time', 'Why I will never {verb} a {thing} again', 'A very serious post about {topic}', 'I got a new {thing}!!!', 'Quiz results: I am a {food}',
];
const EVENT = ['found a {thing} in my cereal', 'accidentally joined a {hobby} club', 'saw a {animal} at {place}', 'tried to {verb} a {thing} (it did not go well)', 'got lost at {place}', 'won a {thing} at the county fair', 'ate {food} for breakfast, lunch AND dinner'];
const BODY = [
  'So this happened. I was at {place} minding my own business when out of nowhere a {animal} walked up to me holding a {thing}. I don\'t know where it got it. I don\'t know where it went. All I know is that my life is different now.',
  'Okay so I know I said I would post more often. I lied. But I am back now and I have SO much to tell you guys!!',
  'First of all, {food}. That\'s it. That\'s the first thing. Second of all, my {person} has started {hobby}, which means the house is now full of {thing:s}.',
  'Today was {adj}. Like, really {adj}. I woke up, had {food}, and then spent {n} hours {verbIng} {thing:s}. My {pet}, my {animal}, watched the whole time. I think he was judging me.',
  'I have been thinking a lot about {topic} lately. Is it weird that it makes me so happy? Leave a comment and tell me I\'m not the only one.',
  'Also, shout-out to everyone who commented on my last post!! You guys are the best readers a blog could ask for. All {n} of you.',
  'Anyway that\'s all for now. Gotta go, {food} is ready. Peace out!! :)',
  'Lesson learned: never trust a {thing} that looks too {adj}. Also, always carry a spare {thing2}.',
  'In other news, I finally finished my {thing} collection. Pictures coming soon (my camera is being weird).',
];
const MOODS = ['happy', 'sleepy', 'hyper', 'bored', 'confused', 'excited', 'hungry', 'giggly', 'accomplished', 'chill', 'blah'];
const BCOM = ['lol i love ur blog', 'same thing happened to me!!', 'haha you are so random', 'that is the best story ever', 'post more pics!!', 'omg the {animal} part lol', 'cant wait for the next post!!', 'u should write a book', 'i laughed so hard i snorted', 'wait what happened with the {thing}??', 'following!!', 'this is my favorite blog on the whole internet'];

function blogKit(ctx) {
  return kit(ctx, { person: LEX.person, event: EVENT, pet: ['Biscuit', 'Captain', 'Noodle', 'Peanut', 'Sir Fluffington'] });
}

function postDate(r, i) {
  const d = daysAgo(i * r.int(2, 9) + r.int(0, 2));
  d.setHours(r.int(7, 23), r.int(0, 59));
  return d;
}

function makePost(k, rr, i) {
  const d = postDate(rr, i);
  const title = k.say(rr.pick(POST_T));
  const body = rr.sample(BODY, rr.int(2, 4)).map((b) => k.say(b)).join('\n\n');
  return { title, date: `${fmtDate(d)} ${fmtTime(d)}`, month: d.getMonth() + 1, body, comments: rr.int(0, 24), mood: rr.pick(MOODS), music: `${bandName(rr)} - ${songTitle(rr)}` };
}

function shell(ctx, c, inner) {
  const th = theme(ctx.site);
  return `<div class="pg blog" style="${vars(th)}">
  <div class="rv bl-head"><h1>${lnk(ctx.root, c.title)}</h1><div class="bl-sub">${esc(c.subtitle)}</div></div>
  <div class="bl-cols"><div class="bl-main">${inner}</div>
  <div class="bl-side">
    <div class="rv bl-card"><h3>About Me</h3>${avatar(c.author, 64)}<p><b>${esc(c.author)}</b><br>${esc(c.about)}</p></div>
    <div class="rv bl-card"><h3>Followers (${fmt(c.followers)})</h3><div class="bl-fol">${list(8, (i) => avatar(c.author + i, 28)).join('')}</div>${gl('Follow', { act: 'follow', cls: 'sm orange' })}</div>
    <div class="rv bl-card"><h3>Blog Archive</h3><ul class="bl-arch"><li>&#9660; 2012 (${c.archive.reduce((a, b) => a + b.n, 0)})<ul>${each(c.archive, (m) => `<li>&#9658; ${esc(m.month)} (${m.n})</li>`)}</ul></li><li>&#9658; 2011 (${c.y2011})</li></ul></div>
    <div class="rv bl-card"><h3>My Blog List</h3><ul>${each(c.blogroll, (b) => `<li>${siteA(linkTo('blog', b.topic, b.name))}</li>`)}</ul></div>
    <div class="rv bl-card"><h3>Labels</h3><p class="bl-labels">${c.labels.map(esc).join(', ')}</p></div>
    <div class="rv bl-card bl-song" data-song="${esc(c.song.title)}|${esc(c.song.artist)}"></div>
    <div class="rv bl-card">${counter(c.visitors, 'odo')}<br><small>visitors since 2010</small></div>
  </div></div>
  <div class="rv bl-foot">Powered by Blogaroo &middot; Template by ${esc(c.author)}</div>
</div>`;
}

function blogMeta(k0, ctx) {
  const r = new Rng('blogmeta:' + ctx.site.key);
  const k = blogKit({ ...ctx, r });
  const author = username(r);
  return {
    title: ctx.site.name,
    subtitle: k.say(['the random thoughts of a {adj} {person}', 'where I write about {topic} and stuff', 'est. 2010. updated whenever I feel like it.', 'life, {food}, and everything in between', 'just a kid with a keyboard'], {}),
    author,
    about: k.say(['I like {topic}, {food} and {hobby}. I live in {town} with my {animal}.', '{person:cap} by day, blogger by night. Professional {food} eater.', 'Just a regular person who loves {topic}. Follow me!!']),
    followers: r.big(3, 3000),
    archive: list(r.int(3, 6), (i) => ({ month: MONTHS[(fakeMonth() - i + 12) % 12], n: r.int(1, 9) })),
    y2011: r.int(4, 60),
    labels: r.sample(['random', 'life', 'school', 'food', 'pets', 'music', 'rants', 'funny', 'family', 'games', 'weekend', ctx.site.topic], 6),
    blogroll: list(5, (i) => { const s = siteLink('blog', r.fork('br' + i), fanTopic(r.fork('t' + i))); return { name: s.name, topic: s.topic }; }),
    song: { title: songTitle(r), artist: bandName(r) },
    visitors: r.big(100, 90000),
  };
}
const fakeMonth = () => new Date().getMonth();

export const blogHome = {
  gen(ctx) {
    const k = blogKit(ctx);
    const meta = blogMeta(k, ctx);
    return { ...meta, posts: list(3, (i) => makePost(k, ctx.r.fork('post' + i), i)) };
  },
  title: (c) => c.title,
  render(c, ctx) {
    return shell(ctx, c, each(c.posts, (p, i) => `<article class="rv bl-post"><div class="bl-date">${esc(p.date.replace(/ \d+:\d+ [AP]M$/, ''))}</div><h2>${lnk(P.post(ctx.root, p.title, p.month), p.title)}</h2>${i === 0 ? `<div class="bl-pic">${pic(ctx.url + p.title, { label: 'pic from today!!' })}</div>` : ''}<div class="bl-body">${paras(p.body)}</div><div class="bl-meta">Mood: <b>${esc(p.mood)}</b> &middot; Listening to: <i>${esc(p.music)}</i></div><div class="bl-pf">Posted by ${esc(c.author)} at ${esc(p.date.replace(/^.* (\d+:\d+ [AP]M)$/, '$1'))} &middot; ${lnk(P.post(ctx.root, p.title, p.month), `${p.comments} comments`)}</div></article>`));
  },
  mount: (el, c, ctx, api) => mountFollow(el, api),
};

export const blogPost = {
  gen(ctx) {
    const k = blogKit(ctx);
    const meta = blogMeta(k, ctx);
    const r = ctx.r;
    const post = makePost(k, r.fork('post'), 0);
    post.title = ctx.hint.t || cap(deslug(ctx.params.slug));
    const m = ctx.params.month || 11;
    post.date = post.date.replace(/^\w+/, MONTHS[(m - 1 + 12) % 12] || 'November');
    post.body = r.sample(BODY, r.int(3, 5)).map((b) => k.say(b)).join('\n\n');
    return { ...meta, post, comments: makeComments(r.fork('cm'), k.say, r.int(3, 9), { first: r.chance(0.5), lines: BCOM }) };
  },
  title: (c) => `${c.title}: ${c.post.title}`,
  render(c, ctx) {
    const p = c.post;
    return shell(ctx, c, `<article class="rv bl-post"><div class="bl-date">${esc(p.date.replace(/ \d+:\d+ [AP]M$/, ''))}</div><h2>${esc(p.title)}</h2><div class="bl-pic">${pic(ctx.url, { label: 'me!!' })}</div><div class="bl-body">${paras(p.body)}</div><div class="bl-meta">Mood: <b>${esc(p.mood)}</b> &middot; Listening to: <i>${esc(p.music)}</i></div><div class="bl-pf">Posted by ${esc(c.author)} &middot; ${lnk(ctx.root, '&laquo; Home', { html: '&laquo; Home' })}</div></article>
    ${commentsBlock(c.comments, ctx, { flavor: 'blog', title: 'Comments' })}`);
  },
  mount(el, c, ctx, api) {
    mountFollow(el, api);
    return mountComments(el, ctx, api, { author: c.author });
  },
};

function mountFollow(el, api) {
  el.querySelector('[data-act="follow"]')?.addEventListener('click', (e) => { e.currentTarget.textContent = 'Following!'; api.sound('click'); });
}

// ---------------- news ----------------
const NEWS_T = [
  'Local {person:title} Finds Missing {thing:title} {placeLost}', 'Scientists Confirm {animal:s:title} Prefer {food:title}', '{town} Breaks Record for Largest {thing:title}',
  '{animal:title} Elected Honorary Mayor of {town}', 'Study: {pct}% of People Have Never Seen a {thing:title}', '{band} Announce Surprise Concert at {town} Bowling Alley',
  'New {product} Sells Out in {n} Minutes', 'Experts Warn: Your {thing:title} May Be Smarter Than You', 'Weather: Chance of {weatherThing:title} Tomorrow',
  '{town} Pie-Eating Contest Ends in {n}-Way Tie', 'Missing {animal:title} Returns Home Wearing Tiny Hat', 'Kids Build Working {thing:title} Out of Cardboard',
];
const NEWS_B = [
  '{town} - In a story that has captured the attention of the entire nation (or at least the entire block), {what}. Witnesses described the scene as "pretty great, honestly."',
  '"I just did not see that coming," said {person2}, a local {person} who was at the scene. "One minute everything was normal, the next minute, well. You read the headline."',
  'Officials say there is no cause for alarm, only mild amazement. A spokesperson for the {town} Department of {thing:title}s confirmed that the situation is "under control, mostly."',
  'Experts are still scratching their heads. "In my {n} years of studying {thing:s}, I have never seen anything like it," said Dr. {person2}.',
  'Locals have already started selling commemorative T-shirts, mugs and {thing:s}. One vendor reported selling {big} units before lunch.',
  'This is a developing story. StartBlaster News will update this article as more {food} becomes available.',
];

export const newsHome = {
  gen(ctx) {
    const k = kit(ctx, { person: LEX.person, placeLost: LEX.placeLost });
    const { r } = k;
    const sec = (name, n) => ({ name, items: list(n, (i) => k.say(NEWS_T[(r.int(0, 99) + i) % NEWS_T.length])) });
    return { top: k.say(r.pick(NEWS_T)), sections: [sec('U.S. & World', 4), sec('Science', 3), sec('Entertainment', 3), sec('Odd News', 4)] };
  },
  title: () => 'StartBlaster News - Top Stories',
  render(c) {
    return `<div class="pg news"><div class="nw-wrap">
  <div class="rv nw-head"><span class="nw-logo">${lnk(HOME, '', { html: 'StartBlaster<b>News</b>' })}</span><span>${esc(fmtDate(daysAgo(0)))}</span></div>
  <div class="rv nw-top">${pic('news-top' + c.top, { cls: 'nw-tp' })}<h1>${lnk(P.story(c.top), c.top)}</h1></div>
  <div class="nw-secs">${each(c.sections, (s) => `<div class="rv nw-sec"><h2>${esc(s.name)}</h2><ul>${each(s.items, (t) => `<li>${lnk(P.story(t), t)}</li>`)}</ul></div>`)}</div>
</div></div>`;
  },
};

export const article = {
  gen(ctx) {
    const k = kit(ctx, { person: LEX.person, person2: (rr) => personName(rr) });
    const { r, say } = k;
    const headline = ctx.hint.t || titleCase(deslug(ctx.params.slug));
    const body = [say(NEWS_B[0], { what: headline.charAt(0).toLowerCase() + headline.slice(1) })].concat(r.sample(NEWS_B.slice(1, 5), 3).map((b) => say(b)), say(NEWS_B[5]));
    return {
      headline, byline: personName(r.fork('by')), date: fmtDate(daysAgo(r.int(0, 2))), body: body.join('\n\n'),
      related: list(4, (i) => say(NEWS_T[(r.int(0, 99) + i) % NEWS_T.length], { person: LEX.person, placeLost: LEX.placeLost })),
      comments: makeComments(r.fork('cm'), say, r.int(4, 9), { first: r.chance(0.4), lines: ['this is the best news i have read all year', 'finally some good news', 'i live in {town} and can confirm', 'where can i get one of those T-shirts', 'this should be on the front page', 'my {person} told me about this', 'only on StartBlaster lol'] }),
      ad: { product: productName(r), line: say(['Breaking: {thing:s} are 50% off!', 'Read the news faster with this one weird {thing}']) },
    };
  },
  title: (c) => `${c.headline} - StartBlaster News`,
  render(c, ctx) {
    return `<div class="pg news"><div class="nw-wrap">
  <div class="rv nw-head"><span class="nw-logo">${lnk(`http://${HOSTS.news}/`, '', { html: 'StartBlaster<b>News</b>' })}</span><span>${esc(c.date)}</span></div>
  <h1 class="rv nw-h1">${esc(c.headline)}</h1>
  <div class="rv nw-by">By ${esc(c.byline)}, StartBlaster News Staff Writer &middot; ${esc(c.date)}</div>
  <div class="rv nw-art">${pic(ctx.url, { cls: 'nw-ap', label: 'Photo: StartBlaster News' })}${paras(c.body)}</div>
  <div class="rv">${banner(ctx.r.fork('ad'), c.ad.product, c.ad.line)}</div>
  <div class="rv nw-sec"><h2>Related Stories</h2><ul>${each(c.related, (t) => `<li>${lnk(P.story(t), t)}</li>`)}</ul></div>
  ${commentsBlock(c.comments, ctx, { flavor: 'news', title: 'Reader Comments' })}
</div></div>`;
  },
  mount: (el, c, ctx, api) => mountComments(el, ctx, api),
};

