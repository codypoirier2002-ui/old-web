// Helpers shared by the page generators.
import { LEX } from '../core/lex.js';
import { sayer } from '../core/grammar.js';
import { titleCase, plural, cap, ago, daysAgo, fmtDate, fmtTime, MONTHS } from '../core/util.js';
import { username, songTitle, bandName, productName, personName } from '../core/names.js';

export function kit(ctx, extra = {}) {
  const r = ctx.r;
  const topic = (ctx.site && ctx.site.topic) || 'stuff';
  const vars = {
    topic,
    Topic: titleCase(topic),
    topics: topic,
    site: ctx.site ? ctx.site.name : '',
    n: () => r.int(2, 30),
    big: () => r.int(100, 9999),
    pct: () => r.int(11, 99),
    game: LEX.invGame,
    band: LEX.invBand,
    show: LEX.invShow,
    product: LEX.invProduct,
    user: (rr) => username(rr),
    song: (rr) => songTitle(rr),
    month: () => MONTHS[r.int(0, 10)],
    pet: ['Biscuit', 'Mr. Whiskers', 'Sir Fluffington', 'Pickles', 'Captain', 'Noodle', 'Peanut', 'Buster', 'Princess', 'Meatball'],
    food2: LEX.food,
    thing2: LEX.thing,
    animal2: LEX.animal,
    ...extra,
  };
  const say = sayer(r, LEX, vars);
  return { r, say, topic, T: titleCase(topic), vars };
}

export const list = (n, fn) => Array.from({ length: n }, (_, i) => fn(i));

// "3 hours ago" style, older as i grows
export const agoStr = (r, i = 0) => ago(Math.floor(r.int(3, 50) + i * r.int(20, 600)));

export function stamp(r, daysBack) {
  const d = daysAgo(daysBack);
  d.setHours(r.int(6, 23), r.int(0, 59));
  return `${fmtDate(d)} ${fmtTime(d)}`;
}
export const dateOnly = (daysBack) => fmtDate(daysAgo(daysBack));

export { username, songTitle, bandName, productName, personName, titleCase, plural, cap };

// Comment wars, used on videos, blogs, news, guides and games.
const C_GENERIC = [
  'lol', 'this made my day', 'LOL', 'i cant stop laughing', 'who else is watching this in {month} 2012?', 'this deserves more views',
  'I\'ve watched this {n} times today', 'my {animal} does the exact same thing', 'the {thing} at {n}:{n2} tho', '{n} people disliked this because they are jealous',
  'Thumbs up if you came here from StartBlaster!', 'this is the best thing on the internet', 'i showed this to my mom and she laughed so hard', 'not gonna lie this is genius',
  'anyone else think this is kinda {adj}?', 'why is nobody talking about the {thing}', 'came for the {topic}, stayed for the comments', 'i need this on a T-shirt',
  'this is my favorite {topic} thing ever', 'can we all appreciate how {adj} this is', 'my little brother wont stop quoting this', '10/10 would watch again',
  'lol my {pet} is staring at the screen', 'i was eating {food} while watching this', 'WHAT DID I JUST WATCH', 'best. thing. ever.',
];
const C_FIRST = ['first!', 'FIRST!!!', 'first', 'frist', 'second!', 'FIRST!!!1!', 'first comment!!', 'yay first', 'third lol', 'first and i didnt even watch it yet'];
const C_FIRST_REPLY = ['you\'re not first lol', 'nobody cares about first', 'first to be wrong', 'WHY does everyone do this', '@{who} no you weren\'t', 'i was first but my internet is slow', 'first to reply to the first guy', 'its not a race people', 'congrats on your achievement i guess', 'lol you spelled first wrong'];
const C_REPLY = ['lol same', 'so true', 'this!!', '+1', 'haha yes', 'exactly what i was thinking', 'lmao', 'i agree with this comment', 'underrated comment', 'came here to say this'];

export function makeComments(r, say, n, o = {}) {
  const out = [];
  const firsts = o.first === false ? 0 : r.int(1, 3);
  for (let i = 0; i < n; i++) {
    const rr = r.fork('c' + i);
    const user = username(rr);
    let text;
    if (i < firsts) text = rr.pick(C_FIRST);
    else if (o.lines && rr.chance(0.55)) text = say(rr.pick(o.lines), { n2: String(rr.int(10, 59)) });
    else text = say(rr.pick(C_GENERIC), { n2: String(rr.int(10, 59)) });
    if (rr.chance(0.25)) text += ' ' + rr.pick(LEX.emote);
    const replies = [];
    const nr = i < firsts ? rr.int(1, 3) : rr.chance(0.3) ? rr.int(1, 2) : 0;
    for (let j = 0; j < nr; j++) {
      const r2 = rr.fork('r' + j);
      replies.push({ user: username(r2), text: say(i < firsts ? r2.pick(C_FIRST_REPLY) : r2.pick(C_REPLY), { who: user }), ago: agoStr(r2, i) });
    }
    out.push({ user, text, ago: agoStr(rr, i), likes: rr.big(0, 900), replies });
  }
  return out;
}

export { C_FIRST_REPLY };

