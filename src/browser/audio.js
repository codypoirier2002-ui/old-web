// All sound is synthesized with WebAudio: clicks, dings, a dial-up modem and
// little chiptune songs for the music players. Nothing plays until you tap
// something (phones require that anyway).
import { Rng } from '../core/rng.js';

let ctx = null;
let master = null;
let muted = false;

export function audio() {
  if (!ctx) {
    const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.6;
      master.connect(ctx.destination);
    } catch { ctx = null; return null; }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}
export const unlock = () => audio();
export function setMuted(m) {
  muted = m;
  if (master) master.gain.value = m ? 0 : 0.6;
}

function env(g, t, a, peak, d) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}
function tone(type, f0, f1, t, dur, vol = 0.2, dest = master) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  env(g, t, 0.005, vol, dur);
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(t + dur + 0.05);
}
let noiseBuf = null;
function noise(t, dur, vol, freq = 3000, q = 1, type = 'bandpass', dest = master) {
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain();
  env(g, t, 0.002, vol, dur);
  s.connect(f).connect(g).connect(dest);
  s.start(t, Math.random() * 0.5);
  s.stop(t + dur + 0.05);
}

export function sfx(name) {
  if (muted || !audio()) return;
  const t = ctx.currentTime + 0.01;
  switch (name) {
    case 'click': noise(t, 0.025, 0.25, 2500, 0.8); tone('square', 1800, 1200, t, 0.012, 0.03); break;
    case 'pop': tone('sine', 520, 900, t, 0.07, 0.15); break;
    case 'ding': tone('sine', 1318, 1318, t, 0.7, 0.18); tone('sine', 659, 659, t, 0.5, 0.08); break;
    case 'blip': tone('square', 880, 1320, t, 0.06, 0.06); break;
    case 'bonk': tone('triangle', 240, 70, t, 0.14, 0.3); break;
    case 'start': [523, 659, 784, 1046].forEach((f, i) => tone('square', f, f, t + i * 0.07, 0.07, 0.05)); break;
    case 'win': [523, 659, 784, 1046, 1318].forEach((f, i) => tone('square', f, f, t + i * 0.08, 0.1, 0.05)); break;
    case 'lose': [392, 330, 262, 196].forEach((f, i) => tone('triangle', f, f, t + i * 0.12, 0.14, 0.15)); break;
    case 'error': tone('square', 220, 220, t, 0.12, 0.06); tone('square', 165, 165, t + 0.14, 0.2, 0.06); break;
    case 'chime': [392, 523, 659, 784].forEach((f, i) => tone('sine', f, f, t + i * 0.18, 0.9, 0.12)); tone('sine', 1046, 1046, t + 0.72, 1.4, 0.08); break;
    default: break;
  }
}

// ---- dial-up modem handshake (about 6 seconds) ----
export function modem() {
  if (muted || !audio()) return () => {};
  const out = ctx.createGain();
  out.gain.value = 0.5;
  out.connect(master);
  let t = ctx.currentTime + 0.05;
  const T = (type, f, d, v = 0.15) => { tone(type, f, f, t, d, v, out); };
  // dial tone
  tone('sine', 350, 350, t, 0.9, 0.12, out); tone('sine', 440, 440, t, 0.9, 0.12, out);
  t += 1.0;
  // DTMF digits
  const dtmf = [[697, 1209], [770, 1336], [852, 1477], [697, 1336], [941, 1336], [770, 1209], [852, 1336]];
  for (const [a, b] of dtmf) { tone('sine', a, a, t, 0.09, 0.12, out); tone('sine', b, b, t, 0.09, 0.12, out); t += 0.13; }
  t += 0.4;
  // answer tone with phase reversals
  T('sine', 2100, 1.1, 0.12);
  t += 1.15;
  // V.8 handshake-ish warble and screech
  for (let i = 0; i < 14; i++) { T('square', i % 2 ? 980 : 1180, 0.06, 0.04); t += 0.06; }
  noise(t, 0.6, 0.12, 1800, 2, 'bandpass', out);
  T('sawtooth', 1650, 0.6, 0.03);
  t += 0.6;
  for (let i = 0; i < 10; i++) { T('square', 600 + Math.random() * 1800, 0.05, 0.03); t += 0.05; }
  noise(t, 1.2, 0.16, 2400, 0.6, 'bandpass', out);
  tone('sawtooth', 1200, 2400, t, 1.2, 0.02, out);
  t += 1.25;
  noise(t, 0.4, 0.08, 4000, 0.5, 'highpass', out);
  const end = t + 0.5;
  return () => { try { out.gain.setValueAtTime(0, ctx.currentTime); out.disconnect(); } catch { /* ignore */ } void end; };
}

// ---- chiptune songs for the music players ----
const PROGS = [[0, 7, 9, 5], [0, 5, 7, 7], [9, 5, 0, 7], [0, 9, 5, 7], [0, 3, 8, 7], [0, 5, 3, 7]];
const SCALES = [[0, 2, 4, 7, 9, 12, 14, 16], [0, 3, 5, 7, 10, 12, 15, 17], [0, 2, 4, 5, 7, 9, 11, 12]];
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

let playing = null;
export function stopSong() { if (playing) { playing.stop(); playing = null; } }

export function playSong(seed, onBeat) {
  stopSong();
  if (!audio()) return null;
  const r = new Rng('song:' + seed);
  const root = 50 + r.int(0, 9);
  const prog = r.pick(PROGS);
  const scale = r.pick(SCALES);
  const bpm = r.int(100, 150);
  const step = 60 / bpm / 4;
  const lead = r.pick(['square', 'square', 'triangle', 'sawtooth']);
  const melody = [];
  let deg = r.int(2, 5);
  for (let i = 0; i < 64; i++) {
    if (i % 2 === 1 && r.chance(0.7)) { melody.push(null); continue; }
    if (r.chance(0.18)) { melody.push(null); continue; }
    deg = Math.max(0, Math.min(scale.length - 1, deg + r.pick([-2, -1, -1, 0, 1, 1, 2])));
    melody.push(scale[deg]);
  }
  const out = ctx.createGain();
  out.gain.value = 0.55;
  out.connect(master);
  let i = 0;
  let next = ctx.currentTime + 0.08;
  const tick = () => {
    while (next < ctx.currentTime + 0.15) {
      const s = i % 64;
      const chord = prog[Math.floor(s / 16)];
      const m = melody[s];
      if (m != null) tone(lead, midi(root + 12 + chord * 0 + m), 0, next, step * 1.8, 0.05, out);
      if (s % 4 === 0) tone('triangle', midi(root - 12 + chord), 0, next, step * 3, 0.16, out);
      if (s % 4 === 2) tone('triangle', midi(root + chord), 0, next, step * 1.5, 0.08, out);
      if (s % 8 === 0) tone('sine', 150, 45, next, 0.12, 0.35, out);
      if (s % 8 === 4) noise(next, 0.08, 0.14, 1800, 0.7, 'bandpass', out);
      if (s % 2 === 0) noise(next, 0.025, 0.05, 8000, 0.7, 'highpass', out);
      if (onBeat && s % 4 === 0) { const when = (next - ctx.currentTime) * 1000; setTimeout(() => onBeat(s), Math.max(0, when)); }
      next += step;
      i++;
    }
  };
  tick();
  const iv = setInterval(tick, 30);
  const p = {
    stop() {
      clearInterval(iv);
      try { out.gain.setTargetAtTime(0, ctx.currentTime, 0.05); setTimeout(() => out.disconnect(), 400); } catch { /* ignore */ }
    },
  };
  playing = p;
  return p;
}
