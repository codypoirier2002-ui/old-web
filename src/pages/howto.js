// HowToTown and tips sites: guide lists and step-by-step guides.
import { LEX } from '../core/lex.js';
import { HOSTS } from '../core/url.js';
import { fmt, titleCase, deslug, cap } from '../core/util.js';
import { esc, lnk, gl, each } from '../render/html.js';
import { counter, scene, banner } from '../render/widgets.js';
import { commentsBlock, mountComments } from '../render/comments.js';
import { page as P } from '../core/links.js';
import { kit, list, username, productName, makeComments } from './common.js';

const CATS = ['Home & Garden', 'Food & Cooking', 'Pets & Animals', 'Hobbies & Crafts', 'Computers & Tech', 'Sports & Fitness', 'Life Hacks', 'Party Ideas'];
const GUIDE_T = [
  'How to {verb} a {thing}', 'How to Teach Your {animal:title} to {trick}', 'How to Make {food:title} in 5 Minutes', 'How to Win at {game}', 'How to Fold a Fitted Sheet',
  'How to Organize Your {thing:s:title}', 'How to Make a {thing:title} out of Cardboard', 'How to Survive a Week Without {food:title}', 'How to Be Popular on the Internet',
  'How to Clean Your Keyboard (Without Breaking It)', 'How to Build the Ultimate Pillow Fort', 'How to Speed Up Your Computer', 'How to Talk to Your {animal:title}',
  'How to Throw a {thing:title}-Themed Party', 'How to Start a Fan Club', 'How to Make Your {thing:title} Look Brand New', 'How to Name Your {animal:title}',
];
const TRICK = ['Sit', 'Wave', 'Skateboard', 'Play Dead', 'Fetch Snacks', 'Dance', 'Do Your Homework'];
const STEP = [
  'Gather your supplies. You will need {sup}. Lay everything out on a clean table (or the floor, we won\'t judge).',
  'Take a deep breath. {x:cap} can sense fear.', 'Carefully pick up the {thing} and hold it at a {deg} degree angle.',
  'Gently {verb2} the {part} until it makes a satisfying "boop" sound.', 'Wait {n} minutes. Use this time to have a snack.',
  'Check your progress. If it looks {adj}, you\'re doing it right. If it looks {adj2}, go back to step {back}.',
  'Repeat steps {a}-{b} until you are happy with the result, or until dinner.', 'Ask a grown-up (or a {animal}) to help you with this part.',
  'Add a pinch of {food}. Trust us on this one.', 'Admire your work. Take a picture. Show your {person}.',
  'Put everything back where you found it. Seriously. Your {person} will thank you.', 'Celebrate! You have successfully completed the hardest part.',
  'Wiggle it a little. Not too much! Just a little.', 'Line up all the pieces from smallest to biggest. Or biggest to smallest. Both work.',
];
const TIPS = ['If it doesn\'t work the first time, try turning it off and on again.', 'This works best on a {day}.', 'Wear old clothes. Things might get {adj}.', 'Playing music by {band} helps, according to experts (us).', 'Keep a {thing} nearby just in case.', 'Practice makes perfect. Or at least practice makes "pretty okay".'];
const WARN = ['Do not attempt during a thunderstorm.', 'Keep away from {animal:s} who look suspicious.', 'Do not eat the {thing}. Even if it looks tasty.', 'Results may vary. Results may be {adj}.', 'Never leave a {thing} unattended near {food}.'];
const PARTS = ['handle', 'lid', 'corner', 'button', 'top part', 'squishy bit', 'thingamajig', 'left side'];
const SUP = () => ['a {thing}', 'two {thing2:s}', 'some tape', 'a bowl of {food}', 'patience', 'a {color} marker', 'a friend'];

function guideTitle(k, rr) {
  return k.say(rr.pick(GUIDE_T), { trick: TRICK });
}

const DAY = ['Tuesday', 'Saturday', 'rainy day', 'full moon'];

export const howtoHome = {
  gen(ctx) {
    const k = kit(ctx, { day: DAY });
    const { r } = k;
    const big = ctx.site.key === HOSTS.howto;
    const cat = ctx.params.cat ? titleCase(deslug(ctx.params.cat)) : '';
    return {
      big, cat,
      name: big ? 'HowToTown' : ctx.site.name,
      featured: guideTitle(k, r.fork('feat')),
      popular: list(10, (i) => ({ title: guideTitle(k, r.fork('p' + i)), views: r.fork('v' + i).big(100, 900000) })),
      cats: CATS,
      tip: k.say(TIPS),
    };
  },
  title: (c) => (c.cat ? `${c.cat} - ${c.name}` : `${c.name} - Learn How to Do Anything!`),
  render(c, ctx) {
    return `<div class="pg howto"><div class="ht-wrap">
  <div class="rv ht-head"><span class="ht-logo">${lnk(ctx.root, '', { html: c.big ? 'HowTo<b>Town</b>' : esc(c.name) })}</span><span class="ht-tag">${c.big ? 'Learn how to do anything! (Almost.)' : `Tips &amp; tricks for ${esc(ctx.site.topic)}`}</span></div>
  ${c.big ? `<div class="rv ht-cats">${each(c.cats, (x) => lnk(`${ctx.root}category/${x.toLowerCase().replace(/[^a-z]+/g, '-')}`, x))}</div>` : ''}
  ${c.cat ? `<h2 class="rv ht-h">${esc(c.cat)}</h2>` : `<div class="rv ht-feat">${scene(c.featured, { caption: 'FEATURED' })}<div><small>Featured guide</small><br>${lnk(ctx.root + slugUrl(c.featured), c.featured, { cls: 'big' })}</div></div>`}
  <div class="rv ht-box"><h3>${c.cat ? 'Guides' : 'Most Popular Guides'}</h3><ol>${each(c.popular, (g) => `<li>${lnk(ctx.root + slugUrl(g.title), g.title)} <small>${fmt(g.views)} views</small></li>`)}</ol></div>
  <div class="rv ht-box tip"><b>Tip of the day:</b> ${esc(c.tip)}</div>
  <div class="rv ht-foot">&copy; 2012 ${esc(c.name)} &middot; ${counter(ctx.r.big(10000, 999999), 'odo')}</div>
</div></div>`;
  },
};

const slugUrl = (t) => P.guide(t).split('/').pop();

export const guide = {
  gen(ctx) {
    const k = kit(ctx, { person: LEX.person, x: ctx.site.key === HOSTS.howto ? 'your {thing}' : ctx.site.topic, deg: () => String(ctx.r.pick([12, 37, 45, 90, 107])), day: DAY, verb2: ['twist', 'tap', 'poke', 'pat', 'jiggle', 'polish', 'nudge'], part: PARTS, adj2: LEX.adj, sup: SUP() });
    const { r, say } = k;
    const title = ctx.hint.t || titleCase(deslug(ctx.params.slug));
    const ns = r.int(5, 8);
    const steps = r.sample(STEP.slice(1), ns - 1).map((s, i) => say(s, { back: String(Math.max(1, i)), a: '2', b: String(Math.max(3, i + 1)) }));
    steps.unshift(say(STEP[0], { sup: r.sample(SUP(), 3).map((x) => say(x)).join(', ') }));
    return {
      title,
      intro: say(['Have you ever wanted to {task}? Of course you have. Everybody has. In this easy guide, we will show you exactly how, step by step.', 'Learning to {task} is easier than you think! Thousands of people do it every day (we assume). Follow these {n} simple steps.', '{task:cap}? No problem! This guide was written by experts* and tested on real {animal:s}.\n\n*We read a book about it once.'], { task: title.replace(/^how (to|2) /i, '').toLowerCase() }),
      needs: r.sample(SUP(), 4).map((x) => say(x)),
      steps,
      tips: r.sample(TIPS, 2).map((x) => say(x)),
      warnings: r.sample(WARN, 2).map((x) => say(x)),
      author: username(r.fork('au')),
      helpful: r.big(12, 40000),
      views: r.big(300, 900000),
      related: list(5, (i) => guideTitle(k, r.fork('rel' + i))),
      comments: makeComments(r.fork('cm'), say, r.int(4, 8), { first: false, lines: ['this actually worked!!', 'step {n} confused me but i figured it out', 'my {person} made me read this', 'great guide thanks!!', 'tried this and now my {thing} is shiny', 'does this work on {animal:s}?'] }),
      ad: { product: productName(r), line: say(['Make {thing:s} 300% shinier!', 'Order now and get a second one FREE*', 'The only {thing} you will ever need!']) },
    };
  },
  title: (c) => `${c.title} - ${'HowToTown'}`,
  render(c, ctx) {
    return `<div class="pg howto"><div class="ht-wrap">
  <div class="rv ht-head"><span class="ht-logo">${lnk(ctx.root, '', { html: ctx.site.key === HOSTS.howto ? 'HowTo<b>Town</b>' : esc(ctx.site.name) })}</span><span class="ht-tag">${fmt(c.views)} views &middot; by ${esc(c.author)}</span></div>
  <h1 class="rv ht-title">${esc(c.title)}</h1>
  <p class="rv ht-intro">${esc(c.intro)}</p>
  <div class="rv ht-box needs"><h3>Things You'll Need</h3><ul>${each(c.needs, (n) => `<li>${esc(cap(n))}</li>`)}</ul></div>
  ${each(c.steps, (s, i) => `<div class="rv ht-step"><div class="ht-num">${i + 1}</div><div class="ht-sb">${i % 2 === 0 ? `<div class="ht-ill">${scene(ctx.url + i, { subject: ['box', 'blob', 'star', 'cat', 'tree'][i % 5] })}</div>` : ''}<p>${esc(s)}</p></div></div>`)}
  <div class="rv">${banner(ctx.r.fork('ad'), c.ad.product, c.ad.line)}</div>
  <div class="rv ht-box tip"><h3>Tips</h3><ul>${each(c.tips, (t) => `<li>${esc(t)}</li>`)}</ul></div>
  <div class="rv ht-box warn"><h3>Warnings</h3><ul>${each(c.warnings, (t) => `<li>${esc(t)}</li>`)}</ul></div>
  <div class="rv ht-help" data-help>Was this article helpful? ${gl('Yes', { act: 'yes', cls: 'sm green' })} ${gl('No', { act: 'no', cls: 'sm silver' })}</div>
  <div class="rv ht-box"><h3>Related Guides</h3><ul>${each(c.related, (g) => `<li>${lnk(P.guide(g), g)}</li>`)}</ul></div>
  ${commentsBlock(c.comments, ctx, { flavor: 'howto' })}
</div></div>`;
  },
  mount(el, c, ctx, api) {
    el.querySelector('[data-help]')?.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      api.sound('click');
      e.currentTarget.innerHTML = b.dataset.act === 'yes' ? `Thanks! <b>${fmt(c.helpful + 1)}</b> people found this helpful.` : 'Sorry to hear that! We have alerted the experts. (They are on lunch.)';
    });
    return mountComments(el, ctx, api);
  },
};

