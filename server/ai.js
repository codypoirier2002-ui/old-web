// The AI writer: a tiny local server endpoint that asks Claude to write a
// page. The API key stays here on your computer; the browser only ever
// talks to /api/page. Pages are cached and calls are capped per day.
import fs from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { SCHEMAS } from './schemas.js';
import { SYSTEM, userPrompt } from './prompt.js';
import { AI_TYPES, MODEL } from '../src/ai/types.js';

const TYPES = new Set(AI_TYPES);
const MAX_BODY = 16 * 1024;
const CACHE_MAX = 3000;

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function writeJson(file, data) {
  try { fs.writeFileSync(file, JSON.stringify(data)); } catch { /* read-only disk is fine */ }
}
const today = () => new Date().toLocaleDateString('en-CA');
const str = (v, max = 120) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max) : '');

function send(res, code, body) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error('too big')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export function createAiWriter({ apiKey, baseURL, cap = 150, root = process.cwd(), log = console.log }) {
  const hasKey = typeof apiKey === 'string' && apiKey.trim().length > 10;
  const client = hasKey ? new Anthropic({ apiKey: apiKey.trim(), baseURL: baseURL || undefined, maxRetries: 1, timeout: 60_000 }) : null;
  const usageFile = path.join(root, '.oldweb-usage.json');
  const cacheFile = path.join(root, '.oldweb-cache.json');
  let usage = readJson(usageFile, { date: today(), count: 0 });
  const cache = new Map(Object.entries(readJson(cacheFile, {})));
  const inflight = new Map();
  const formats = new Map();
  let badKey = false;
  let saveTimer = null;

  const saveCache = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => writeJson(cacheFile, Object.fromEntries(cache)), 500);
  };
  const used = () => {
    if (usage.date !== today()) usage = { date: today(), count: 0 };
    return usage.count;
  };
  const status = () => ({
    ai: hasKey && !badKey,
    model: MODEL,
    used: used(),
    cap,
    reason: !hasKey ? 'no-key' : badKey ? 'bad-key' : used() >= cap ? 'cap' : '',
  });
  const formatFor = (type) => {
    if (!formats.has(type)) formats.set(type, zodOutputFormat(SCHEMAS[type]));
    return formats.get(type);
  };

  async function write(p) {
    const msg = await client.messages.parse({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM,
      messages: [{ role: 'user', content: userPrompt(p) }],
      output_config: { format: formatFor(p.type), effort: 'low' },
    });
    if (msg.stop_reason === 'refusal') throw Object.assign(new Error('declined'), { reason: 'declined' });
    if (msg.stop_reason === 'max_tokens') throw Object.assign(new Error('too long'), { reason: 'too-long' });
    if (!msg.parsed_output) throw Object.assign(new Error('no output'), { reason: 'unparsed' });
    return { content: msg.parsed_output, out: msg.usage ? msg.usage.output_tokens : 0 };
  }

  async function handlePage(req, res) {
    if (!/application\/json/.test(req.headers['content-type'] || '') || req.headers['x-old-web'] !== '1') return send(res, 403, { ok: false, reason: 'forbidden' });
    let b;
    try { b = JSON.parse(await readBody(req)); } catch { return send(res, 400, { ok: false, reason: 'bad-request' }); }
    const p = {
      type: str(b.type, 30),
      url: str(b.url, 300),
      title: str(b.title),
      topic: str(b.topic, 80),
      siteName: str(b.siteName, 80),
      q: str(b.q, 100),
      from: str(b.from, 60),
    };
    if (!TYPES.has(p.type) || !SCHEMAS[p.type] || !/^http:\/\/[a-z0-9.-]+(:\d+)?\//.test(p.url)) return send(res, 400, { ok: false, reason: 'bad-request' });
    const st = status();
    if (cache.has(p.url)) return send(res, 200, { ok: true, content: cache.get(p.url), cached: true, ...st });
    if (!st.ai) return send(res, 200, { ok: false, ...st });
    if (st.used >= cap) return send(res, 200, { ok: false, ...st, reason: 'cap' });

    let job = inflight.get(p.url);
    if (!job) {
      used();
      usage.count++;
      writeJson(usageFile, usage);
      job = write(p).finally(() => inflight.delete(p.url));
      inflight.set(p.url, job);
    }
    try {
      const { content, out } = await job;
      cache.set(p.url, content);
      if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
      saveCache();
      log(`[old-web] AI wrote ${p.type} ${p.url} (${out} tokens) - ${usage.count}/${cap} today`);
      return send(res, 200, { ok: true, content, ...status() });
    } catch (err) {
      let reason = err.reason || 'error';
      if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) { badKey = true; reason = 'bad-key'; log('[old-web] The API key was rejected. Check ANTHROPIC_API_KEY in .env.local. Using the built-in generator.'); }
      else if (err instanceof Anthropic.RateLimitError) reason = 'rate-limited';
      else if (err instanceof Anthropic.APIConnectionError) reason = 'offline';
      else if (err instanceof Anthropic.APIError) reason = `api-${err.status || 'error'}`;
      log(`[old-web] AI writer fell back to built-in for ${p.url}: ${reason}`);
      return send(res, 200, { ok: false, ...status(), reason });
    }
  }

  const middleware = (req, res, next) => {
    const url = (req.url || '').split('?')[0];
    if (url === '/api/status' || url.endsWith('/api/status')) return send(res, 200, status());
    if ((url === '/api/page' || url.endsWith('/api/page')) && req.method === 'POST') {
      handlePage(req, res).catch(() => send(res, 500, { ok: false, reason: 'error' }));
      return undefined;
    }
    return next();
  };

  const describe = () => (hasKey
    ? `AI writer ON (${MODEL}, up to ${cap} new pages a day, ${used()} used today)`
    : 'AI writer OFF (no ANTHROPIC_API_KEY in .env.local) - using the built-in generator');

  return { middleware, status, describe };
}
