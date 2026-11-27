// Tests the AI writer without spending anything:
//  1. every AI schema only asks for fields the built-in page really has,
//  2. a fake AI answer for every type merges and renders cleanly,
//  3. the full server path works through the real SDK against a local
//     mock of the Messages API (no key, no network).
// Run: node scripts/test-ai.mjs
import http from 'node:http';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { SCHEMAS } from '../server/schemas.js';
import { createAiWriter } from '../server/ai.js';
import { AI_TYPES } from '../src/ai/types.js';
import { merge } from '../src/ai/merge.js';
import { generate, render, makeCtx, typeOf } from '../src/pages/index.js';

const SAMPLE = {
  forumIndex: 'http://www.hamstertalk.com/', board: 'http://www.hamstertalk.com/forum/off-topic', thread: 'http://www.hamstertalk.com/thread/is-toast-soup',
  videoHome: 'http://www.vidoodle.com/', watch: 'http://www.vidoodle.com/watch/cat-vs-box', channel: 'http://www.vidoodle.com/user/bob99',
  fan: 'http://www.llamas4ever.net/', guestbook: 'http://www.llamas4ever.net/guestbook.html', links: 'http://www.llamas4ever.net/links.html', fanSub: 'http://www.llamas4ever.net/facts.html',
  clan: 'http://www.clannoodleninjas.com/', trickshot: 'http://www.noodleninjastrickshots.com/',
  howtoHome: 'http://www.howtotown.com/', guide: 'http://www.howtotown.com/how-to-fix-a-sock',
  blogHome: 'http://sparkles.blogaroo.com/', blogPost: 'http://sparkles.blogaroo.com/2012/11/hello.html', newsHome: 'http://news.startblaster.net/', article: 'http://news.startblaster.net/story/llama-mayor',
  results: 'http://www.searchasaurus.com/search?q=rubber+ducks', inbox: 'http://www.mailmole.com/', email: 'http://www.mailmole.com/read/1-fw-hi',
  chatRoom: 'http://www.chatterboxchat.net/room/the-lobby', gamesHome: 'http://www.arcadeville.net/', game: 'http://www.arcadeville.net/play/pickle-catcher',
  personal: 'http://members.bubblehost.net/~garypickleworth/',
  product: 'http://www.speedboost3000-official.com/',
};

let fails = 0;
const fail = (m) => { fails++; console.log('  FAIL ' + m); };

// Fake answer from a JSON schema: strings "AI<path>", 3 items per list.
function fake(schema, p = 'x', defs = schema.$defs || {}) {
  if (schema.$ref) return fake(defs[schema.$ref.split('/').pop()], p, defs);
  if (schema.enum) return schema.enum[0];
  if (schema.type === 'string') return `AI${p}`;
  if (schema.type === 'array') return [0, 1, 2].map((i) => fake(schema.items, `${p}${i}`, defs));
  if (schema.type === 'object') return Object.fromEntries(Object.entries(schema.properties).map(([k, v]) => [k, fake(v, `${p}.${k}`, defs)]));
  return null;
}

// Every key the schema asks for must exist in the built-in content.
function covers(js, content, where, defs = js.$defs || {}) {
  if (js.$ref) return covers(defs[js.$ref.split('/').pop()], content, where, defs);
  if (js.type === 'object') {
    if (!content || typeof content !== 'object') return fail(`${where}: built-in has no object here`);
    for (const k of Object.keys(js.properties)) {
      if (!(k in content)) fail(`${where}.${k} is not in the built-in content`);
      else covers(js.properties[k], content[k], `${where}.${k}`, defs);
    }
  } else if (js.type === 'array') {
    if (!Array.isArray(content)) return fail(`${where}: built-in is not a list`);
    const ex = content.find((x) => x != null && (typeof x !== 'object' || Object.keys(x).length)) ?? content[0];
    if (ex !== undefined) covers(js.items, ex, `${where}[]`, defs);
  } else if (js.type === 'string' || js.enum) {
    if (typeof content !== 'string') fail(`${where}: built-in is ${typeof content}, schema wants string`);
  }
}

console.log('1-2. schemas vs built-in pages');
for (const type of AI_TYPES) {
  const url = SAMPLE[type];
  if (!url) { fail(`no sample url for ${type}`); continue; }
  const base = generate(url, {});
  if (base.type !== type) { fail(`${url} resolved to ${base.type}, expected ${type}`); continue; }
  const js = z.toJSONSchema(SCHEMAS[type]);
  covers(js, base.content, type);
  const answer = fake(js);
  SCHEMAS[type].parse(answer);
  const content = merge(base.content, answer);
  const page = { ...base, content, source: 'ai' };
  page.title = typeOf(type).title(content, makeCtx(page));
  const html = render(page).html;
  const text = html.replace(/<[^>]+>/g, ' ');
  const hits = (text.match(/AIx/g) || []).length;
  if (/undefined|NaN|\[object /.test(text)) fail(`${type} renders undefined/NaN`);
  if (hits === 0) fail(`${type}: none of the AI text shows up on the page`);
  // hostile answer: markup and links must not survive
  const evil = merge(base.content, JSON.parse(JSON.stringify(answer).replace(/AIx[^"]*/g, '<img src=x onerror=alert(1)> http://evil.example/ <script>x</script> hi')));
  const eh = render({ ...base, content: evil }).html;
  if (/<img|onerror|evil\.example|<script/i.test(eh)) fail(`${type}: unsafe text got through`);
  console.log(`  ok ${type.padEnd(11)} ${hits} AI fields shown`);
}

console.log('3. server path through the SDK with a mock API');
const calls = [];
const mock = http.createServer((req, res) => {
  let b = '';
  req.on('data', (c) => { b += c; });
  req.on('end', () => {
    const body = JSON.parse(b);
    calls.push({ path: req.url, key: req.headers['x-api-key'] || String(req.headers.authorization || '').replace(/^Bearer /, ''), body });
    const schema = body.output_config && body.output_config.format && body.output_config.format.schema;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ id: 'msg_mock', type: 'message', role: 'assistant', model: body.model, content: [{ type: 'text', text: JSON.stringify(fake(schema)) }], stop_reason: 'end_turn', stop_sequence: null, usage: { input_tokens: 100, output_tokens: 200 } }));
  });
});
await new Promise((r) => mock.listen(0, r));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'oldweb-'));
const logs = [];
const writer = createAiWriter({ apiKey: 'sk-ant-test-not-a-real-key-000', baseURL: `http://127.0.0.1:${mock.address().port}`, cap: 3, root: tmp, log: (m) => logs.push(m) });
const app = http.createServer((req, res) => writer.middleware(req, res, () => { res.statusCode = 404; res.end(); }));
await new Promise((r) => app.listen(0, r));
const base = `http://127.0.0.1:${app.address().port}`;
const post = (payload, headers = { 'content-type': 'application/json', 'x-old-web': '1' }) => fetch(base + '/api/page', { method: 'POST', headers, body: JSON.stringify(payload) }).then((r) => r.json().then((j) => ({ status: r.status, j })));

const st = await (await fetch(base + '/api/status')).json();
if (!st.ai || st.cap !== 3) fail('status should say AI on with cap 3: ' + JSON.stringify(st));
const one = await post({ type: 'thread', url: SAMPLE.thread, title: 'Is toast soup', topic: 'hamsters', siteName: 'HamsterTalk' });
if (!one.j.ok || !one.j.content.posts) fail('page call failed: ' + JSON.stringify(one.j).slice(0, 200));
const req0 = calls[0];
if (!req0) fail('mock API never called');
else {
  if (req0.body.model !== 'claude-haiku-5-5') fail('wrong model ' + req0.body.model);
  if (req0.body.output_config.effort !== 'low') fail('effort not low');
  if ('temperature' in req0.body) fail('temperature must not be sent');
  if (!/Is toast soup/.test(JSON.stringify(req0.body.messages))) fail('title not in prompt');
  if (req0.key !== 'sk-ant-test-not-a-real-key-000') fail('key not sent to API');
  console.log(`  ok request: model=${req0.body.model}, effort=${req0.body.output_config.effort}, max_tokens=${req0.body.max_tokens}, schema sent=${!!req0.body.output_config.format.schema}`);
}
const again = await post({ type: 'thread', url: SAMPLE.thread });
if (!again.j.cached || calls.length !== 1) fail('second request for same page should come from cache');
else console.log('  ok cache: same page served without a new call');
const csrf = await post({ type: 'thread', url: SAMPLE.watch }, { 'content-type': 'text/plain' });
if (csrf.status !== 403) fail('request without the X-Old-Web header should be refused');
else console.log('  ok refused request without the custom header');
const bad = await post({ type: 'portal', url: 'http://www.startblaster.net/' });
if (bad.status !== 400) fail('non-AI type should be rejected');
await post({ type: 'watch', url: SAMPLE.watch, title: 'cat vs box' });
await post({ type: 'fan', url: SAMPLE.fan });
const capped = await post({ type: 'guide', url: SAMPLE.guide });
if (capped.j.ok || capped.j.reason !== 'cap') fail('daily cap not enforced: ' + JSON.stringify(capped.j).slice(0, 120));
else console.log(`  ok daily cap: stopped after ${calls.length} calls (cap 3)`);
const usage = JSON.parse(fs.readFileSync(path.join(tmp, '.oldweb-usage.json'), 'utf8'));
if (usage.count !== 3) fail('usage file count ' + usage.count);
if (logs.some((l) => /sk-ant/.test(l))) fail('a log line printed the key!');
else console.log('  ok logs never contain the key');

const off = createAiWriter({ apiKey: '', root: tmp, log: () => {} });
if (off.status().ai || off.status().reason !== 'no-key') fail('no key should mean AI off');
else console.log('  ok without a key the writer is off: ' + off.describe());

app.close(); mock.close();
console.log(fails ? `\n${fails} FAILED` : '\nall AI writer tests passed');
process.exit(fails ? 1 : 0);
