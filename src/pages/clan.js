// Gaming clans (recruiting!) and trickshot montage pages.
import { LEX } from '../core/lex.js';
import { fmt, deslug, cap, duration } from '../core/util.js';
import { esc, lnk, gl, each, paras } from '../render/html.js';
import { counter, avatar, marquee, blink } from '../render/widgets.js';
import { player, mountPlayers } from '../render/player.js';
import { commentsBlock, mountComments } from '../render/comments.js';
import { theme, vars } from '../render/theme.js';
import { site as siteLink, page as P } from '../core/links.js';
import { kit, list, username, songTitle, bandName, dateOnly, makeComments } from './common.js';
import { clanName, clanTag, shotName } from '../core/names.js';

const REQS = [
  'Must have a working mic (and use it for good, not for chewing)', 'K/D of 1.5+ (or a really good attitude)', 'Must be 13+ and able to type in full sentences',
  'Active at least 3 nights a week', 'Must know the difference between a {thing} and a {thing2}', 'No rage quitting (we will know)',
  'Must wear the clan tag with PRIDE', 'Good teamwork > good aim', 'Must be able to do at least one ({shot})', 'Bring snacks to LAN parties (mandatory)',
];
const RULES = [
  'No camping (unless it\'s actual camping, we love camping)', 'Respect all members. Even {user}.', 'No spamming the shoutbox with {food}', 'Practice every Tuesday 7pm EST',
  'What happens in clan wars stays in clan wars', 'Always say GG. Win or lose.', 'Officers have the final say on pizza toppings', 'Don\'t feed the {animal}',
];
const ABOUT = [
  'We are {name} [{tag}], one of the most {adj} clans in {game}. Founded in {yr} by {leader}, we have won {n} tournaments and lost {m} (we don\'t talk about those).',
  '{name} [{tag}] is a competitive but friendly {game} clan. We play hard, we laugh harder, and we take {food} breaks very seriously.',
];
const SHOUT = ['gg last night guys!!', 'who\'s on tonight?', 'new montage dropping soon', 'can someone carry me lol', 'practice at 7 dont forget', 'that last round was insane', 'brb {food}', 'we need 2 more for the war on saturday', 'lol {user} fell off the map again', 'GG EZ (jk you guys were good)'];

function clanKit(ctx) {
  return kit(ctx, { shot: (rr) => shotName(rr) });
}

export const clan = {
  gen(ctx) {
    const k = clanKit(ctx);
    const { r, say } = k;
    const name = ctx.site.topic && ctx.site.topic.split(' ').length <= 3 && !/^(the |my )/i.test(ctx.site.topic) ? cap(ctx.site.topic).replace(/\b\w/g, (m) => m.toUpperCase()) : clanName(r);
    const tag = clanTag(name, r);
    const game = r.pick(LEX.invGame);
    const leader = username(r.fork('lead'));
    const ranks = ['Leader', 'Co-Leader', 'Officer', 'Officer', 'Member', 'Member', 'Member', 'Member', 'Recruit', 'Recruit'];
    const roster = list(r.int(7, 10), (i) => {
      const rr = r.fork('m' + i);
      return { name: i === 0 ? leader : username(rr), rank: ranks[i] || 'Member', kd: (rr.float(0.8, 3.4)).toFixed(2), status: rr.pick(['Online', 'Offline', 'Offline', 'Away', 'In Game']) };
    });
    return {
      name, tag, game, leader,
      motto: say(['Fear the {sillyNoun}', 'No mercy. Some snacks.', 'We came. We saw. We respawned.', 'Skill. Honor. Pizza.', 'Born to frag, forced to do homework']),
      about: say(r.pick(ABOUT), { name, tag, leader, game, yr: String(r.int(2008, 2011)), m: String(r.int(1, 9)) }),
      recruiting: r.chance(0.85),
      reqs: r.sample(REQS, 6).map((x) => say(x)),
      rules: r.sample(RULES, 5).map((x) => say(x)),
      roster,
      wars: list(5, (i) => { const rr = r.fork('w' + i); const win = rr.chance(0.7); return { vs: `[${clanTag(clanName(rr), rr)}] ${clanName(rr)}`, result: win ? 'WIN' : 'LOSS', score: win ? `${rr.int(6, 15)}-${rr.int(0, 5)}` : `${rr.int(2, 6)}-${rr.int(7, 12)}` }; }),
      sponsors: r.sample(['VoltJuice Energy', 'Turbo Snacks', 'MegaRAM Doubler', 'Pocket Disco', 'Grandma\'s Cookies (Official Clan Cookie)'], 2),
      shouts: list(6, (i) => { const rr = r.fork('s' + i); return { user: rr.pick(roster).name, msg: say(rr.pick(SHOUT)) }; }),
      song: { title: songTitle(r), artist: bandName(r) },
      visitors: r.big(500, 200000),
    };
  },
  title: (c) => `[${c.tag}] ${c.name} - ${c.recruiting ? 'RECRUITING' : 'Official Site'}`,
  render(c, ctx) {
    const th = theme(ctx.site);
    const montage = siteLink('trickshot', ctx.r.fork('mont'), c.name);
    return `<div class="pg clan" style="${vars(th)}"><div class="cl-wrap">
  <div class="rv cl-head"><div class="cl-tag">[${esc(c.tag)}]</div><h1>${esc(c.name)}</h1><div class="cl-motto">"${esc(c.motto)}"</div></div>
  ${c.recruiting ? `<div class="rv cl-recruit">${blink('>>')} WE ARE RECRUITING ${blink('<<')}</div>` : '<div class="rv cl-recruit closed">RECRUITMENT CLOSED</div>'}
  <div class="rv">${marquee(`Welcome to the official site of [${c.tag}] ${c.name} *** Playing ${c.game} *** Clan war this Saturday *** Check out our new montage ***`)}</div>
  <div class="cl-cols"><div class="cl-main">
    <section class="rv cl-box"><h2>About Us</h2>${paras(c.about)}<p>Main game: <b>${esc(c.game)}</b> &middot; Leader: <b>${esc(c.leader)}</b></p></section>
    ${c.recruiting ? `<section class="rv cl-box"><h2>Requirements</h2><ul>${each(c.reqs, (x) => `<li>${esc(x)}</li>`)}</ul></section>` : ''}
    <section class="rv cl-box"><h2>Roster</h2><table class="cl-ros"><tr><th>Gamertag</th><th>Rank</th><th>K/D</th><th>Status</th></tr>${each(c.roster, (m) => `<tr><td>${esc(m.name)}</td><td>${esc(m.rank)}</td><td>${esc(m.kd)}</td><td class="st-${esc(m.status.toLowerCase().replace(/\s/g, ''))}">${esc(m.status)}</td></tr>`)}</table></section>
    <section class="rv cl-box"><h2>Clan Wars</h2><table class="cl-ros">${each(c.wars, (w) => `<tr><td>vs ${esc(w.vs)}</td><td class="${w.result === 'WIN' ? 'win' : 'loss'}">${esc(w.result)}</td><td>${esc(w.score)}</td></tr>`)}</table></section>
    <section class="rv cl-box"><h2>Clan Rules</h2><ol>${each(c.rules, (x) => `<li>${esc(x)}</li>`)}</ol></section>
    ${c.recruiting ? `<section class="rv cl-box"><h2>Apply Now</h2><form class="cl-apply" data-apply><input name="tag" maxlength="30" placeholder="Your gamertag" required><input name="kd" maxlength="8" placeholder="Your K/D"><textarea name="why" rows="2" maxlength="300" placeholder="Why do you want to join ${esc(c.tag)}?"></textarea>${gl('Send Application', { type: 'submit', cls: 'green' })}</form></section>` : ''}
  </div><div class="cl-side">
    <section class="rv cl-box"><h2>Shoutbox</h2><div class="cl-shout">${each(c.shouts, (s) => `<div><b>${esc(s.user)}:</b> ${esc(s.msg)}</div>`)}</div></section>
    <section class="rv cl-box"><h2>Media</h2><p>${lnk(montage.url, 'Watch our trickshot montages!', { topic: montage.topic, site: montage.site, kind: 'trickshot' })}</p></section>
    <section class="rv cl-box"><h2>Sponsors</h2>${each(c.sponsors, (s) => `<div class="cl-spon">${esc(s)}</div>`)}</section>
    <div class="rv cl-song" data-song="${esc(c.song.title)}|${esc(c.song.artist)}"></div>
  </div></div>
  <div class="rv cl-foot">Visitors: ${counter(c.visitors, 'led')}<br><small>Site by ${esc(c.leader)} &middot; &copy; 2012 [${esc(c.tag)}] All rights reserved</small></div>
</div></div>`;
  },
  mount(el, c, ctx, api) {
    el.querySelector('[data-apply]')?.addEventListener('submit', (e) => {
      e.preventDefault();
      api.sound('ding');
      api.alert(`Your application has been sent to ${c.leader}. Expect a reply in 3-5 business days. Practice your trickshots in the meantime!`, `[${c.tag}] Recruitment`);
      e.target.reset();
    });
  },
};

// ---------------- trickshot montages ----------------
export const trickshot = {
  gen(ctx) {
    const k = clanKit(ctx);
    const { r, say } = k;
    const crew = ctx.site.topic && ctx.site.topic.split(' ').length <= 3 ? ctx.site.topic.replace(/\b\w/g, (m) => m.toUpperCase()) : clanName(r);
    const n = r.int(2, 14);
    const title = ctx.params.slug ? (ctx.hint.t || cap(deslug(ctx.params.slug))) : say(['INSANE {game} TRICKSHOT MONTAGE #{num} - {crew}', '{crew} Trickshot Montage #{num} (SICKEST EVER)', 'BEST {game} TRICKSHOTS OF 2012 - {crew} #{num}', '{crew} - "{song}" - A {game} Montage'], { crew, num: String(n), song: songTitle(r) });
    const players = list(5, (i) => username(r.fork('pl' + i)));
    let t = r.int(5, 15);
    return {
      title, crew, game: r.pick(LEX.invGame),
      views: r.big(500, 3000000), likes: r.big(20, 50000),
      date: dateOnly(r.int(1, 200)),
      dur: r.int(150, 420),
      shots: list(r.int(6, 10), (i) => { const rr = r.fork('s' + i); t += rr.int(12, 40); return { time: duration(t), player: rr.pick(players), shot: shotName(rr) }; }),
      song: { title: songTitle(r), artist: bandName(r) + r.pick([' (dubstep remix)', '', ' (Wobble Mix)', ' ft. DJ Toastmaster']) },
      editor: username(r.fork('ed')),
      shoutouts: r.sample(players, 3).concat([`[${clanTag(clanName(r), r)}] ${clanName(r)}`]),
      desc: say(['Took us {n} weeks to hit all these shots. Like if you want part {num2}!!', 'SUB FOR MORE!!! Every like = one more trickshot attempt', 'Hit these with no mods, no cheats, just skill (and {n} hours of trying)'], { num2: String(n + 1) }),
      comments: makeComments(r.fork('cm'), say, r.int(7, 12), { lines: ['that {shot} at {n}:{n2} was CRAZY', 'song name??', 'the editing in this is so clean', 'how do you even hit that', 'sub to me i do trickshots too', '{crew} best clan', 'fake. jk that was insane', 'part {num2} when??'].map((l) => l.replace('{crew}', crew).replace('{num2}', String(n + 1))) }),
      others: list(4, (i) => say(['{crew} Trickshot Montage #{m}', '{crew} Killcam Compilation #{m}', '{crew} - Best of {month}', '{crew} Fails & Bloopers #{m}'], { crew, m: String(Math.max(1, n - i - 1)) })),
    };
  },
  title: (c) => c.title,
  render(c, ctx) {
    const th = theme(ctx.site);
    return `<div class="pg clan ts" style="${vars(th)}"><div class="cl-wrap">
  <div class="rv cl-head small"><h1>${esc(c.crew)} Trickshots</h1><div class="cl-motto">Edited by ${esc(c.editor)} &middot; ${esc(c.game)}</div></div>
  <div class="rv">${player(ctx.url, { style: 'montage', dur: c.dur, caption: 'NO WAY' })}</div>
  <h2 class="rv ts-title">${esc(c.title)}</h2>
  <div class="rv ts-stats">${fmt(c.views)} views &middot; &#9650; ${fmt(c.likes)} &middot; ${esc(c.date)} ${gl('SUB 4 MORE', { act: 'sub', cls: 'sm red' })}</div>
  <section class="rv cl-box"><h2>Shots in this montage</h2><table class="cl-ros">${each(c.shots, (s) => `<tr><td class="ts-t">${esc(s.time)}</td><td>${esc(s.player)}</td><td>${esc(s.shot)}</td></tr>`)}</table></section>
  <section class="rv cl-box"><p>${esc(c.desc)}</p><p><b>Song:</b> ${esc(c.song.artist)} - ${esc(c.song.title)}<br><b>Shoutouts:</b> ${c.shoutouts.map(esc).join(', ')}</p></section>
  <section class="rv cl-box"><h2>More Montages</h2><ul>${each(c.others, (o) => `<li>${lnk(P.montage(ctx.root, o), o)}</li>`)}</ul></section>
  ${commentsBlock(c.comments, ctx, { flavor: 'video' })}
  <div class="rv cl-foot">${counter(ctx.r.big(1000, 900000), 'led')}</div>
</div></div>`;
  },
  mount(el, c, ctx, api) {
    const a = mountPlayers(el, api);
    const b = mountComments(el, ctx, api);
    el.querySelector('[data-act="sub"]')?.addEventListener('click', (e) => { e.currentTarget.textContent = 'SUBBED!!'; api.sound('click'); });
    return () => { a(); b(); };
  },
};

void avatar;
