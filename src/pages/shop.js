// Infomercial landing pages for made-up products (where the ads go).
import { LEX } from '../core/lex.js';
import { fmt } from '../core/util.js';
import { esc, gl, each, paras, lnk } from '../render/html.js';
import { scene, counter, stars } from '../render/widgets.js';
import { HOME } from '../core/url.js';
import { kit, list, personName } from './common.js';

const PITCH = [
  'Are you tired of {thing:s} that just don\'t {verb2}? Do your {thing2:s} keep {problem}? Then you need {P}!',
  'Introducing {P}, the {adj} new way to {verb} your {thing}. Scientists* are amazed!\n\n*Our neighbor Gary, who owns a lab coat.',
  'Finally! {P} does the work so you don\'t have to. Just plug it in, press the big button, and relax with some {food}.',
];
const FEAT = ['Works on {thing:s}, {thing2:s} AND {animal:s}!', '{n}x faster than doing it yourself', 'Now in {color}!', 'Fits in your pocket (most pockets)', 'Batteries included (2 of 9)', 'As seen on TV (late at night)', 'Dishwasher safe-ish', 'Makes a satisfying "boop" sound', 'No assembly required. Okay, a little assembly.', 'Approved by {n} out of 10 {animal:s}'];
const TESTI = ['I was skeptical, but now my {thing} is the envy of {town}!', 'My {animal} loves it. I love it. We all love it.', 'I bought {n} of them. No regrets.', 'It changed my life. Well, my afternoon.', 'Best ${price} I ever spent!!!', 'Finally I can {verb} my {thing} in peace.'];

export const product = {
  gen(ctx) {
    const P = ctx.hint.t && ctx.hint.t.length < 40 ? ctx.hint.t : ctx.site.name.replace(/\s*Official$/i, '');
    const k = kit(ctx, { P, verb2: ['work', 'shine', 'sparkle', 'listen', 'cooperate'], problem: ['falling over', 'getting lost', 'being boring', 'making weird noises'] });
    const { r, say } = k;
    const price = `${r.int(9, 49)}.95`;
    return {
      name: P,
      tagline: say(['The last {thing} you will ever need!', 'Order now and get a SECOND one FREE*!', 'As seen on TV!', 'It\'s like magic, but with buttons!']),
      pitch: say(r.pick(PITCH)),
      features: r.sample(FEAT, 5).map((f) => say(f)),
      testimonials: list(3, (i) => { const rr = r.fork('t' + i); return { name: personName(rr), from: rr.pick(LEX.town), quote: say(rr.pick(TESTI), { price }) }; }),
      price,
      oldPrice: `${r.int(60, 199)}.99`,
      bonus: say(['But wait, there\'s more! Order in the next {n} minutes and we\'ll throw in a FREE {thing}!', 'Call now and get the {P} Travel Case absolutely FREE*! (*just pay shipping)']),
      sold: r.big(1000, 900000),
    };
  },
  title: (c) => `${c.name} - Official Site - Order Now!`,
  render(c, ctx) {
    return `<div class="pg shop"><div class="sh-wrap">
  <div class="rv sh-burst">AS SEEN<br>ON TV!</div>
  <h1 class="rv sh-name">${esc(c.name)}</h1>
  <div class="rv sh-tag">${esc(c.tagline)}</div>
  <div class="rv sh-hero">${scene(ctx.url, { subject: 'box', caption: c.name })}</div>
  <div class="rv sh-pitch">${paras(c.pitch)}</div>
  <ul class="rv sh-feat">${each(c.features, (f) => `<li>${esc(f)}</li>`)}</ul>
  <div class="rv sh-price"><s>$${esc(c.oldPrice)}</s> <b>Only $${esc(c.price)}!</b><br><small>plus shipping &amp; handling</small></div>
  <div class="rv sh-bonus">${esc(c.bonus)}</div>
  <form class="rv sh-order" data-order><b>ORDER NOW!</b><input name="name" placeholder="Your name" maxlength="40"><select name="qty"><option>1</option><option>2</option><option>3</option><option>A LOT</option></select>${gl('YES! I WANT IT!', { type: 'submit', cls: 'red' })}<small>Operators are standing by!</small></form>
  <div class="rv sh-testi"><h2>What Our Customers Say</h2>${each(c.testimonials, (t) => `<blockquote>${stars(5)}<br>"${esc(t.quote)}"<br><small>- ${esc(t.name)}, ${esc(t.from)}</small></blockquote>`)}</div>
  <div class="rv sh-foot">Over ${fmt(c.sold)} sold! &middot; ${counter(ctx.r.big(5000, 900000), 'led')}<br><small>*Results not typical. Product may not exist. Not available in stores. Or anywhere.</small><br>${lnk(HOME, 'Back to StartBlaster!')}</div>
</div></div>`;
  },
  mount(el, c, ctx, api) {
    el.querySelector('[data-order]')?.addEventListener('submit', (e) => {
      e.preventDefault();
      api.sound('ding');
      api.alert(`Thank you for your order${e.target.name.value ? ', ' + e.target.name.value.slice(0, 30) : ''}! Your ${c.name} will arrive in 6 to 8 weeks. Or 6 to 8 years. Shipping is weird.`, 'Order Confirmed!');
    });
  },
};

