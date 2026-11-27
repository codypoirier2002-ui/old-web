// Message boards: an index, thread lists and threads full of silly arguments.
import { LEX } from '../core/lex.js';
import { fmt, titleCase, plural, deslug, cap } from '../core/util.js';
import { kv } from '../browser/storage.js';
import { esc, lnk, gl, each, paras } from '../render/html.js';
import { avatar, counter, banner } from '../render/widgets.js';
import { theme, vars } from '../render/theme.js';
import { page as P } from '../core/links.js';
import { kit, list, agoStr, stamp, username, productName } from './common.js';

const BOARDS = [
  ['{Topic} Discussion', 'Talk about anything and everything {topic}.'],
  ['Off-Topic Lounge', 'Anything goes (within reason). Snacks welcome.'],
  ['Introductions', 'New here? Say hi! We don\'t bite (much).'],
  ['Pics & Videos', 'Show off your {topic} pics. No pics = didn\'t happen.'],
  ['Help & Advice', 'Got a {topic} problem? Ask the experts (us).'],
  ['Buy / Sell / Trade', 'Trade your stuff. No refunds. No llamas.'],
  ['The Debate Pit', 'Settle it once and for all. Keep it friendly!'],
  ['Rules & Announcements', 'READ BEFORE POSTING. Seriously.'],
  ['Newbie Corner', 'No question is too silly. Okay, some are.'],
  ['Games & Contests', 'Forum games, contests and the legendary counting thread.'],
];

const T_DEBATE = [
  '{a:title} > {b:title}. Fight me.', 'Is {x} a {y}?', 'Unpopular opinion: {x} is overrated', '{a:title} or {b:title}?? (POLL)',
  'Why does everyone hate {x}???', 'Settle this: {a} or {b}', 'Am I the only one who thinks {x} is {adj}?', '{x:title} appreciation thread',
  'Is it weird that I {verb} my {thing} every day?', 'PSA: {x} is NOT a {y}', 'Hot take: {a} is better than {b}', 'Can we talk about {x} for a sec',
  'My {person} says {x} is a {y}. Thoughts?', 'Official {a} vs {b} thread (keep it civil!!)', 'Which is better for {topic}: {a} or {b}?',
];
const T_OTHER = [
  'Post your {topic} setup!', 'Help!!! my {thing} is making a weird noise', 'New member, love {topic}!', 'Rate my {topic} pics (1-10)', 'The counting thread (part {n})',
  'Funniest thing that happened to you with {topic}?', 'Selling: slightly used {thing}', 'Anyone else from {town}?', 'What are you eating right now?', 'Forum birthday thread!!',
  'Last person to post here wins', 'Name a better {topic} than this. I\'ll wait.', 'Is this normal for {topic}?? (pic)', 'What did you get for your birthday?', 'Weird dream about {topic} last night',
];

const RANKS = [['Newbie', 1, 30], ['Member', 30, 400], ['Senior Member', 400, 2500], ['Forum Legend', 2500, 12000], ['Old Timer', 800, 6000]];
const SIGS = [
  '~*~ {quote} ~*~', 'Proud owner of {n} {animal:s}', '{game} rank: Platinum Pancake', 'If you can read this, you are awesome.', '"{quote}" - my mom',
  'Currently listening to: {band} - {song}', 'Member of the {Topic} Fan Club since 2008', 'Life is short. Eat the {food}.', 'Signature under construction',
  '{topic} 4 life', 'Click here 4 my homepage!!', 'Trade list: 3 {thing:s}, 1 slightly sticky {thing}', 'Team {a:title} forever', 'Team {b:title} forever',
];
const QUOTES = ['Be the {thing} you wish to see in the world', 'Keep calm and eat {food}', 'Dance like nobody is watching your {animal}', 'Never trust a {animal} with a {thing}', 'Reach for the stars, but bring a snack', 'If at first you don\'t succeed, try {food}'];

// Argument lines. {a} {b}: the two sides. {x}: the thing being argued about.
const L = {
  op: [
    'Ok so I need to settle this once and for all. {a:cap} is CLEARLY better than {b}. I have thought about this for {n} years. Discuss.',
    'Me and my {person} had a huge argument about this at dinner. I say {a}, they say {b}. Who is right? (it\'s me)',
    'I\'ve been lurking for a while but I finally have to say it. {x:cap}. Is. Overrated. There, I said it.',
    'Serious question. Every time I bring this up people look at me funny. So is {x} a {y} or not??',
    'Title says it all. Let\'s hear it, people. {a:cap} or {b}?',
    'Just had a realization in the shower and now I can\'t stop thinking about it. {x:cap}. Think about it.',
  ],
  proA: [
    '{a:cap}. End of discussion.', 'Anyone who picks {b} has never actually tried {a}.', 'My grandpa picked {a} every single day and he lived to 97. Just saying.',
    'I did a scientific study (I asked my {animal}) and the answer is {a}.', '{a:cap} gang where you at?!', 'I can\'t believe this is even a debate. {a:cap}. Obviously.',
    'Team {a} for life. I have a T-shirt and everything.', '{a:cap} is better and I have {n} reasons. Reason 1: it just is.',
  ],
  proB: [
    'Wrong. {b:cap} all day every day.', 'lol {a}? what is this, 2007?', '{b:cap}. I will not be taking questions at this time.', 'I respect your opinion but it is wrong. {b:cap}.',
    'Have you even SEEN {b}? Case closed.', 'Sorry but {b} is just objectively superior. Science proves it (I think).', 'This thread is making me so hungry for {b} right now.',
  ],
  is: [
    'It has {y} energy. I\'m counting it.', 'No. A {y} has to have a lid. Everyone knows that.', 'By that logic my {thing} is also a {y}.', 'If {x} is a {y} then I don\'t know what anything is anymore.',
    'Technically yes but emotionally no.', 'My dictionary says no. My heart says yes.', 'I asked a teacher and she just walked away.',
  ],
  middle: [
    'Why not both?', 'Can\'t we all just get along? Also {b} is better.', 'Honestly I just come here for the arguments.', 'Both of you are wrong. The correct answer is {food}.',
    'You\'re all forgetting the third option: {thing}.', 'I like both and I\'m not ashamed.', 'This is the kind of quality content I pay my internet bill for.',
  ],
  pedant: [
    'Actually, if you look at the dictionary definition of {x}, you\'ll find that it is "{adj} and roughly {y}-shaped." So technically everyone is wrong.',
    'Technically speaking, according to the {town} Institute of {thing:title} Studies, the answer has been "yes" since 1987.',
    'Well actually, in some countries {x} is considered a {y}. I read it on a website once.',
  ],
  side: [
    'Off topic but does anyone know how to {verb} a {thing}?', 'Sorry to hijack the thread but has anyone seen my {animal}? He answers to {pet}.',
    'Unrelated but I just ate {food} and it was amazing.', 'Speaking of {topic}, my {thing} broke again lol', 'wait what forum am I on',
  ],
  meta: [
    'Not this argument again...', '*grabs popcorn*', 'This thread is gold.', 'Bookmarking this thread for later.', 'Use the search function! This was discussed in 2010!',
    'pics or it didn\'t happen', '/thread', 'Nailed it.', 'bump', 'OP is right.', 'OP is wrong but I respect the confidence.', 'lol this escalated quickly',
    'I came here to say this.', 'Page {n} and still no answer. Classic.', 'Can a mod make this a sticky? This is important.',
  ],
  mod: [
    '[MOD NOTE] Let\'s keep it friendly, everybody. No name-calling (calling {a} "delicious" is allowed).',
    '[MOD NOTE] Moving this to The Debate Pit. Please continue arguing there. Politely.',
    '[MOD NOTE] Friendly reminder: we are all here because we love {topic}. Now hug it out. (Also {b} is better. Mod privileges.)',
  ],
  win: ['Told you. I win this thread.', 'I\'m just glad we could all agree that I was right.', 'Thanks everyone. I have changed my mind zero times.', 'OK I tried {b} and... fine. FINE. It\'s pretty good.'],
  help: [
    'Have you tried turning it off and on again?', 'Same thing happened to me. I put it in rice and now it\'s a rice {thing}.', 'Sounds like a classic case of {adj} {thing} syndrome.',
    'My cousin had this problem. He moved to {town}. Not sure if related.', 'Post a pic and we\'ll take a look!', 'Did you check the FAQ? (We don\'t have a FAQ.)',
    'Hey welcome to the forum!! :D', 'Welcome!! You\'re gonna love it here. Don\'t mention the {food} incident.', 'This is the best {topic} forum on the web, you made the right choice.',
  ],
};

function splitTitle(title, k) {
  const t = String(title).replace(/\s+/g, ' ').trim();
  let m;
  if ((m = t.match(/^(.+?)\s+(?:>|vs\.?|or)\s+(.+?)(?:[.?!].*|\s+\(.*\))?$/i)) && m[1].length < 40 && m[2].length < 40) {
    const a = m[1].replace(/^(settle this:|hot take:|official|which is better.*?:)\s*/i, '').trim();
    const b = m[2].replace(/\s*(fight me|thread|\(.*\)).*$/i, '').replace(/[.?!]+$/, '').trim();
    if (a && b) return { a: a.toLowerCase(), b: b.toLowerCase(), x: a.toLowerCase(), y: k.say('{thing}') };
  }
  if ((m = t.match(/is (?:it weird that i )?(.+?) (?:a|an|not a) (.+?)\?*$/i))) return { a: m[1].toLowerCase(), b: 'not a ' + m[2].toLowerCase(), x: m[1].toLowerCase(), y: m[2].toLowerCase() };
  if ((m = t.match(/(?:opinion:|hate|about|appreciation|thinks)\s*(.+?)(?: is| thread| for|\?|$)/i))) {
    const x = m[1].toLowerCase().replace(/[^a-z0-9' -]/g, '').trim();
    if (x) return { a: x, b: k.say('{food}'), x, y: k.say('{thing}') };
  }
  return null;
}

function rankFor(r, isMod) {
  if (isMod) return { rank: 'Moderator', posts: r.int(3000, 20000) };
  const [rank, lo, hi] = r.pick(RANKS);
  return { rank, posts: r.int(lo, hi) };
}

function forumKit(ctx) {
  const k = kit(ctx, { quote: QUOTES, person: LEX.person, y: LEX.thing });
  return k;
}

// ---------------- index ----------------
export const forumIndex = {
  gen(ctx) {
    const k = forumKit(ctx);
    const { r, say } = k;
    const boards = r.sample(BOARDS.slice(0, 7), 5).concat([BOARDS[7]]);
    const mk = (b, i) => {
      const rr = r.fork('b' + i);
      return { name: say(b[0]), desc: say(b[1]), threads: rr.big(20, 4000), posts: rr.big(300, 90000), lastTitle: threadTitle(k, rr), lastUser: username(rr), lastAgo: agoStr(rr, 0) };
    };
    const all = boards.map(mk);
    return {
      tagline: say(['The #1 community for {topic} fans since {yr}', 'Where {topic} lovers argue about {topic}', 'Est. {yr}. Over {big} members and counting!', 'The friendliest {topic} forum on the web (probably)'], { yr: String(r.int(2001, 2010)) }),
      categories: [
        { name: 'General', boards: all.slice(0, 3) },
        { name: 'Community', boards: all.slice(3) },
      ],
      hot: list(5, (i) => { const rr = r.fork('h' + i); return { title: threadTitle(k, rr, true), user: username(rr), replies: rr.big(10, 900), views: rr.big(200, 40000) }; }),
      online: { members: r.int(3, 60), guests: r.int(20, 400), names: list(r.int(3, 7), (i) => username(r.fork('o' + i))) },
      stats: { posts: r.big(20000, 900000), members: r.big(800, 60000), newest: username(r.fork('new')) },
      announcement: say(['Forum upgrade this weekend! Expect {n} minutes of downtime and {n} new smileys.', 'Remember: be nice, no spam, and NO {food} spoilers.', 'Congrats to {user} for winning the {topic} photo contest!!']),
    };
  },
  title: (c, ctx) => `${ctx.site.name} - Index`,
  render(c, ctx) {
    const th = theme(ctx.site);
    return shell(ctx, th, `
  <div class="rv fm-ann"><b>Announcement:</b> ${esc(c.announcement)}</div>
  ${each(c.categories, (cat) => `<table class="rv fm-t"><thead><tr><th class="fm-cat" colspan="3">${esc(cat.name)}</th></tr><tr class="fm-sub"><th>Forum</th><th class="n">Topics / Posts</th><th class="lp">Last Post</th></tr></thead><tbody>
    ${each(cat.boards, (b, i) => `<tr class="${i % 2 ? 'alt' : ''}"><td><span class="fm-ico${i === 0 ? ' new' : ''}"></span>${lnk(P.board(ctx.root, b.name), b.name, { cls: 'fm-bn' })}<div class="fm-d">${esc(b.desc)}</div></td><td class="n">${fmt(b.threads)}<br><small>${fmt(b.posts)}</small></td><td class="lp">${lnk(P.thread(ctx.root, b.lastTitle), b.lastTitle)}<br><small>by ${esc(b.lastUser)}, ${esc(b.lastAgo)}</small></td></tr>`)}
  </tbody></table>`)}
  <table class="rv fm-t"><thead><tr><th class="fm-cat" colspan="3">&#128293; Hot Topics</th></tr></thead><tbody>
    ${each(c.hot, (h, i) => `<tr class="${i % 2 ? 'alt' : ''}"><td>${lnk(P.thread(ctx.root, h.title), h.title, { cls: 'fm-bn' })}<div class="fm-d">started by ${esc(h.user)}</div></td><td class="n">${fmt(h.replies)} replies<br><small>${fmt(h.views)} views</small></td></tr>`)}
  </tbody></table>
  <div class="rv fm-box"><b>Who's Online</b><br>${c.online.members} members and ${c.online.guests} guests: ${c.online.names.map(esc).join(', ')}</div>
  <div class="rv fm-box"><b>Statistics</b><br>Total posts: ${fmt(c.stats.posts)} &middot; Members: ${fmt(c.stats.members)} &middot; Please welcome our newest member, <b>${esc(c.stats.newest)}</b>!</div>`);
  },
};

function threadTitle(k, rr, debate) {
  const v = { a: pickSide(k, rr), b: pickSide(k, rr), x: pickSide(k, rr), y: rr.pick(['soup', 'sandwich', 'salad', 'vegetable', 'sport', 'hat', 'pet', 'dessert', 'musical instrument', 'type of cloud', 'vehicle', 'personality']) };
  return k.say(rr.pick(debate || rr.chance(0.6) ? T_DEBATE : T_OTHER), v);
}
function pickSide(k, rr) {
  return rr.pick([() => rr.pick(LEX.food), () => plural(rr.pick(LEX.thing)), () => plural(rr.pick(LEX.animal)), () => rr.pick(LEX.food), () => k.topic])();
}

// ---------------- board ----------------
export const board = {
  gen(ctx) {
    const k = forumKit(ctx);
    const { r } = k;
    const name = ctx.hint.t || titleCase(deslug(ctx.params.slug));
    const page = ctx.params.page || 1;
    const threads = list(18, (i) => {
      const rr = r.fork('t' + i + ':' + page);
      return { title: threadTitle(k, rr), user: username(rr), replies: rr.big(0, 600), views: rr.big(10, 30000), last: agoStr(rr, i), sticky: page === 1 && i < 2, locked: rr.chance(0.08), hot: rr.chance(0.2) };
    });
    if (page === 1) { threads[0].title = `READ FIRST: ${name} rules`; threads[1].title = k.say(['Welcome to {b}! Introduce yourself here', 'Official {topic} FAQ (updated)'], { b: name }); }
    return { name, page, pages: r.int(page + 2, page + 40), threads };
  },
  title: (c, ctx) => `${c.name} - ${ctx.site.name}`,
  render(c, ctx) {
    const th = theme(ctx.site);
    const base = P.board(ctx.root, c.name);
    return shell(ctx, th, `
  <div class="rv fm-crumb">${lnk(ctx.root, ctx.site.name)} &raquo; <b>${esc(c.name)}</b></div>
  <div class="rv fm-tools">${gl('New Topic', { act: 'newtopic', cls: 'sm' })} <span>Page ${c.page} of ${c.pages}</span></div>
  <table class="rv fm-t"><thead><tr><th class="fm-cat" colspan="3">${esc(c.name)}</th></tr><tr class="fm-sub"><th>Topic</th><th class="n">Replies / Views</th><th class="lp">Last Post</th></tr></thead><tbody>
  ${each(c.threads, (t, i) => `<tr class="${i % 2 ? 'alt' : ''}"><td>${t.sticky ? '<b class="fm-tag">Sticky:</b> ' : ''}${t.locked ? '<b class="fm-tag lock">[Locked]</b> ' : ''}${t.hot ? '<span class="fm-hot">HOT</span> ' : ''}${lnk(P.thread(ctx.root, t.title), t.title, { cls: 'fm-bn' })}<div class="fm-d">by ${esc(t.user)}</div></td><td class="n">${fmt(t.replies)}<br><small>${fmt(t.views)}</small></td><td class="lp"><small>${esc(t.last)}</small></td></tr>`)}
  </tbody></table>
  <div class="rv fm-pages">Pages: ${pagesNav(c, base)}</div>`);
  },
  mount(el, c, ctx, api) {
    el.querySelector('[data-act="newtopic"]')?.addEventListener('click', () => api.alert('You must be logged in to post. Registration is temporarily closed because of a llama-related incident.'));
  },
};

function pagesNav(c, base) {
  const out = [];
  for (let p = 1; p <= Math.min(c.pages, 6); p++) out.push(p === c.page ? `<b>${p}</b>` : lnk(p === 1 ? base : `${base}?p=${p}`, String(p)));
  if (c.pages > 6) out.push('...', lnk(`${base}?p=${c.pages}`, String(c.pages)));
  if (c.page < c.pages) out.push(lnk(`${base}?p=${c.page + 1}`, 'Next &raquo;', { html: 'Next &raquo;' }));
  return out.join(' ');
}

// ---------------- thread ----------------
export const thread = {
  gen(ctx) {
    const k = forumKit(ctx);
    const { r, say } = k;
    const title = ctx.hint.t || cap(deslug(ctx.params.slug));
    const sides = splitTitle(title, k) || { a: pickSide(k, r), b: pickSide(k, r), x: k.topic, y: r.pick(['sandwich', 'soup', 'sport', 'vegetable']) };
    const debate = !!splitTitle(title, k) || r.chance(0.5);
    const v = { ...sides };
    const op = username(r.fork('op'));
    const mod = username(r.fork('mod')).replace(/^(xX|Xx|x)?/, 'Mod');
    const people = list(6, (i) => username(r.fork('u' + i)));
    const n = r.int(7, 14);
    const seq = [];
    if (debate) {
      seq.push(['op', op]);
      for (let i = 1; i < n; i++) {
        const who = r.pick(people);
        const pool = r.weighted({ proA: 3, proB: 3, is: /\ba\b|soup|sandwich/.test(sides.y || '') ? 2 : 1, middle: 2, pedant: 1, side: 1, meta: 3 });
        seq.push([pool, who]);
        if (i === Math.floor(n / 2)) seq.push(['mod', mod]);
      }
      seq.push(['win', op]);
    } else {
      seq.push(['opPlain', op]);
      for (let i = 1; i < n; i++) seq.push([r.weighted({ help: 4, meta: 3, side: 2, middle: 1 }), r.pick(people)]);
    }
    const posts = [];
    seq.forEach(([pool, user], i) => {
      const rr = r.fork('p' + i);
      let text;
      if (pool === 'opPlain') text = say(['Hey everyone! {title}. Any ideas? Thanks in advance!!', 'So yeah. {title}. That\'s the whole post. Discuss!', '{title}\n\nI\'ll go first: I love {topic} more than {food}. Your turn.'], { title });
      else text = say(rr.pick(L[pool]), v);
      if (rr.chance(0.2)) text += ' ' + rr.pick(LEX.emote);
      const quote = i > 1 && pool !== 'mod' && rr.chance(0.3) ? posts[rr.int(0, posts.length - 1)] : null;
      const info = rankFor(rr, pool === 'mod');
      posts.push({ user, text, rank: info.rank, posts: info.posts, joined: `${['Jan', 'Mar', 'Jun', 'Aug', 'Oct', 'Dec'][rr.int(0, 5)]} ${rr.int(2003, 2012)}`, when: stamp(rr, Math.max(0, 6 - i)), sig: rr.chance(0.7) ? say(rr.pick(SIGS), v) : '', quoteUser: quote ? quote.user : '', quoteText: quote ? quote.text.slice(0, 140) : '' });
    });
    const locked = debate && r.chance(0.35);
    return {
      title, views: r.big(100, 50000), posts,
      locked: locked ? say(['Thread locked by {mod}: This has run its course. Also we ran out of popcorn.', 'Thread locked: everyone is right, everyone is wrong, everyone go outside.', 'LOCKED. You guys know why.'], { mod }) : '',
      ad: { product: productName(r), line: say(['Are your {thing:s} too slow? Try it FREE!', 'As seen on TV! Only $19.95!', 'Doctors hate it! (They just think it\'s silly)']) },
    };
  },
  title: (c, ctx) => `${c.title} - ${ctx.site.name}`,
  render(c, ctx) {
    const th = theme(ctx.site);
    return shell(ctx, th, `
  <div class="rv fm-crumb">${lnk(ctx.root, ctx.site.name)} &raquo; ${lnk(P.board(ctx.root, 'The Debate Pit'), 'The Debate Pit')} &raquo; <b>${esc(c.title)}</b></div>
  <h2 class="rv fm-title">${esc(c.title)}</h2>
  <div class="rv fm-tools">${gl('Post Reply', { act: 'reply', cls: 'sm' })} <span>${fmt(c.views)} views</span></div>
  ${each(c.posts, (p, i) => `<div class="rv fm-post${p.rank === 'Moderator' ? ' mod' : ''}">
    <div class="fm-who">${avatar(p.user, 56)}<div><b>${esc(p.user)}</b><br><span class="fm-rank">${esc(p.rank)}</span><br><small>Posts: ${fmt(p.posts)}<br>Joined: ${esc(p.joined)}</small></div></div>
    <div class="fm-body"><div class="fm-meta">#${i + 1} &middot; Posted: ${esc(p.when)}</div>
      ${p.quoteText ? `<blockquote><b>${esc(p.quoteUser)} wrote:</b><br>${esc(p.quoteText)}</blockquote>` : ''}
      <div class="fm-text">${paras(p.text)}</div>
      ${p.sig ? `<div class="fm-sig">${esc(p.sig)}</div>` : ''}
    </div></div>${i === 2 ? `<div class="rv">${banner(ctx.r.fork('ad'), c.ad.product, c.ad.line)}</div>` : ''}`)}
  ${c.locked ? `<div class="rv fm-locked">&#128274; ${esc(c.locked)}</div>` : ''}
  <form class="rv fm-reply" data-reply>
    <b>Quick Reply</b>
    <textarea name="text" rows="3" maxlength="600" placeholder="${c.locked ? 'This thread is locked.' : 'Type your reply...'}"${c.locked ? ' disabled' : ''}></textarea>
    ${gl('Post Reply', { type: 'submit', cls: 'sm' })}
  </form>`);
  },
  mount(el, c, ctx, api) {
    const replyBtn = el.querySelector('[data-act="reply"]');
    const form = el.querySelector('[data-reply]');
    replyBtn?.addEventListener('click', () => form?.querySelector('textarea')?.focus());
    // show replies you posted earlier
    const mine = api.state().replies || [];
    const addPost = (text, user) => {
      form.insertAdjacentHTML('beforebegin', `<div class="fm-post"><div class="fm-who">${avatar(user, 56)}<div><b>${esc(user)}</b><br><span class="fm-rank">Newbie</span><br><small>Posts: 1</small></div></div><div class="fm-body"><div class="fm-meta">Posted: just now</div><div class="fm-text">${paras(text)}</div></div></div>`);
    };
    mine.forEach((m) => addPost(m.text, m.user));
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (c.locked) { api.alert('Sorry, this topic is locked. You cannot edit posts or make replies.'); return; }
      const text = form.text.value.trim();
      if (!text) return;
      const user = kv.get('nick', '') || 'Guest';
      addPost(text, user);
      api.save({ replies: mine.concat({ text: text.slice(0, 600), user }).slice(-20) });
      form.text.value = '';
      api.sound('click');
      api.toast('Reply posted! +1 post count');
    });
  },
};

function shell(ctx, th, inner) {
  return `<div class="pg forum" style="${vars(th)}">
  <div class="fm-wrap">
  <div class="rv fm-head"><div class="fm-logo">${esc(ctx.site.name)}</div><div class="fm-tag2">${esc(ctx.site.topic ? `All about ${ctx.site.topic}` : '')}</div></div>
  <div class="rv fm-nav">${lnk(ctx.root, 'Forum Index')} | <a data-act="fmfaq">FAQ</a> | <a data-act="fmsearch">Search</a> | <a data-act="fmlogin">Login</a> | <a data-act="fmreg">Register</a></div>
  ${inner}
  <div class="rv fm-foot">Powered by BoardBuddy 2.0.22 &copy; 2012 &middot; All times are GMT - 5 Hours<br>${counter(ctx.r.big(10000, 900000), 'odo')}</div>
  </div></div>`;
}

export function mountForumNav(el, api) {
  el.addEventListener('click', (e) => {
    const a = e.target.closest('[data-act]');
    if (!a) return;
    const msgs = { fmfaq: 'FAQ: Q: Is this the best forum? A: Yes.', fmsearch: 'Search is disabled to save server power. Please scroll.', fmlogin: 'Wrong password. Hint: it is not "password".', fmreg: 'Registration is closed for spring cleaning. Please check back in 3-5 business years.' };
    if (msgs[a.dataset.act]) api.alert(msgs[a.dataset.act]);
  });
}
for (const t of [forumIndex, board, thread]) {
  const m = t.mount;
  t.mount = (el, c, ctx, api) => { mountForumNav(el, api); return m ? m(el, c, ctx, api) : undefined; };
}
