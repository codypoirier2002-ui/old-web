// Crawls the built-in generator: renders thousands of pages and checks for
// crashes, "undefined", "NaN", leftover {templates}, and that links land on
// the kind of site they promise. Run: npm test
import { generate, render, resolve } from '../src/pages/index.js';
import { HOME, searchUrl, parse } from '../src/core/url.js';
import { classify, siteKeyOf } from '../src/core/site.js';

const LIMIT = +(process.argv[2] || 3000);
const seen = new Set();
const queue = [HOME, searchUrl('hamsters'), searchUrl('pizza party'), searchUrl('minecraft'), 'http://www.vidoodle.com/', 'http://www.mailmole.com/', 'http://www.arcadeville.net/', 'http://www.chatterboxchat.net/', 'http://www.howtotown.com/', 'http://news.startblaster.net/', 'http://www.searchasaurus.com/', 'http://www.garyshouseofsocks.com/', 'http://youtube.com/', 'about:netskipper', 'about:blank', 'http://www.glitterzone.net/nope/nothing'];
const problems = [];
const types = {};
const kindMismatch = [];
let pagesDone = 0;
const t0 = Date.now();

const BAD = [/undefined/, /NaN/, /\[object /, /\{[a-zA-Z0-9]+(?::[a-z:]+)?\}/];

while (queue.length && pagesDone < LIMIT) {
  const url = queue.shift();
  if (seen.has(url)) continue;
  seen.add(url);
  let page, html;
  try {
    page = generate(url, {});
    html = render(page).html;
  } catch (e) {
    problems.push(`CRASH ${url}: ${e.stack.split('\n').slice(0, 3).join(' | ')}`);
    continue;
  }
  pagesDone++;
  types[page.type] = (types[page.type] || 0) + 1;
  const text = html.replace(/<[^>]+>/g, ' ');
  for (const re of BAD) {
    const m = text.match(re);
    if (m) { problems.push(`${re} in ${page.type} ${url}: ...${text.slice(Math.max(0, m.index - 60), m.index + 40).replace(/\s+/g, ' ')}...`); break; }
  }
  if (!page.title || /undefined/.test(page.title)) problems.push(`bad title ${url}: ${page.title}`);
  const links = [...html.matchAll(/data-go="([^"]+)"[^>]*?(?:data-kind="([^"]+)")?/g)];
  for (const [, raw, kind] of links) {
    const u = raw.replace(/&amp;/g, '&');
    const p = parse(u);
    if (!p) { problems.push(`unparseable link on ${url}: ${u}`); continue; }
    if (kind && !p.about && ['fan', 'forum', 'clan', 'trickshot'].includes(kind)) {
      const got = classify(siteKeyOf(p));
      if (got !== kind) kindMismatch.push(`${kind} -> ${got}: ${u}`);
    }
    if (!seen.has(p.url)) queue.push(p.url);
  }
  // determinism: same URL -> same content
  if (pagesDone % 97 === 0) {
    const again = generate(url, {});
    if (JSON.stringify(again.content) !== JSON.stringify(page.content)) problems.push(`non-deterministic: ${url}`);
  }
}

// every route resolves to a real type
const sample = ['http://www.x4ever.net/guestbook.html', 'http://www.xtalk.com/thread/is-toast-soup', 'http://www.xtalk.com/forum/off-topic', 'http://www.vidoodle.com/watch/my-cat', 'http://www.vidoodle.com/user/bob', 'http://www.mailmole.com/read/1-hi', 'http://www.chatterboxchat.net/room/the-lobby', 'http://www.arcadeville.net/play/pickle-catcher', 'http://bob.blogaroo.com/2012/11/hello.html', 'http://www.howtotown.com/how-to-fix-a-sock', 'http://www.clanpickles.com/', 'http://www.pickletrickshots.com/', 'http://news.startblaster.net/story/hello'];
for (const u of sample) { const r = resolve(u); if (!r || r.type === 'notFound') problems.push(`route missing for ${u} (${r && r.type})`); }

console.log(`pages: ${pagesDone} in ${Date.now() - t0}ms  (${((Date.now() - t0) / pagesDone).toFixed(2)} ms/page)`);
console.log('types:', JSON.stringify(types));
console.log(`kind mismatches: ${kindMismatch.length}`);
kindMismatch.slice(0, 10).forEach((m) => console.log('  ' + m));
console.log(`problems: ${problems.length}`);
problems.slice(0, 40).forEach((p) => console.log('  ' + p));
process.exit(problems.length || kindMismatch.length ? 1 : 0);
