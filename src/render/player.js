// Fake video player. Shows a drawn thumbnail; tap to "play" a short
// procedural animation on a small canvas (buffering included).
import { esc } from './html.js';
import { scene } from './widgets.js';
import { Rng } from '../core/rng.js';
import { duration } from '../core/util.js';

export function player(seed, o = {}) {
  return `<div class="vp${o.style === 'montage' ? ' vp-m' : ''}" data-vp="${esc(seed)}" data-style="${o.style || 'normal'}" data-dur="${o.dur || 60}" data-title="${esc(o.title || '')}">
  <div class="vp-screen">${scene(seed, { caption: o.caption || '' })}<button class="vp-play" aria-label="Play">&#9654;</button></div>
  <div class="vp-bar"><span class="vp-btn">&#9654;</span><span class="vp-track"><i></i></span><span class="vp-time">0:00 / ${duration(o.dur || 60)}</span><span class="vp-hd">HD</span></div>
</div>`;
}

const PALS = [['#86c5ff', '#4caf50'], ['#ffb38a', '#c2b280'], ['#2b2d6e', '#26a69a'], ['#ffd1ec', '#8bc34a'], ['#1a1a1a', '#555']];

export function mountPlayers(root, api) {
  const stops = [];
  root.querySelectorAll('[data-vp]').forEach((vp) => {
    const start = () => {
      if (vp.dataset.on) return;
      vp.dataset.on = '1';
      api.sound('click');
      const scr = vp.querySelector('.vp-screen');
      const canvas = document.createElement('canvas');
      canvas.width = 320; canvas.height = 180;
      canvas.className = 'vp-canvas';
      scr.innerHTML = '<div class="vp-buf"><span></span>Buffering...</div>';
      scr.appendChild(canvas);
      const g = canvas.getContext('2d');
      const r = new Rng(vp.dataset.vp);
      const dur = Math.min(+vp.dataset.dur || 60, 45);
      const montage = vp.dataset.style === 'montage';
      const [sky, ground] = montage ? ['#203040', '#4a5a3a'] : r.pick(PALS);
      const col = r.pick(['#ff6f61', '#6a5acd', '#2ecc71', '#f39c12', '#e84393', '#00a8ff']);
      const track = vp.querySelector('.vp-track i');
      const time = vp.querySelector('.vp-time');
      let t = 0, last = 0, raf = 0, buffering = 1.2 + r.next() * 1.5, rebuffer = r.chance(0.5) ? 4 + r.int(0, 6) : -1;
      const flashes = [];
      const frame = (now) => {
        raf = requestAnimationFrame(frame);
        const dt = Math.min(0.1, last ? (now - last) / 1000 : 0);
        if (now - last < 30) return; // ~30fps is plenty
        last = now;
        if (buffering > 0) { buffering -= dt; if (buffering <= 0) scr.querySelector('.vp-buf')?.remove(); return; }
        if (rebuffer > 0 && t > rebuffer) {
          rebuffer = -1; buffering = 1.4;
          scr.insertAdjacentHTML('afterbegin', '<div class="vp-buf"><span></span>Buffering...</div>');
          return;
        }
        t += dt;
        draw(g, t, sky, ground, col, montage, flashes, r);
        track.style.transform = `scaleX(${Math.min(1, t / dur)})`;
        time.textContent = `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')} / ${Math.floor(+vp.dataset.dur / 60)}:${String(+vp.dataset.dur % 60).padStart(2, '0')}`;
        if (t >= dur) {
          cancelAnimationFrame(raf);
          scr.insertAdjacentHTML('beforeend', '<div class="vp-end"><b>Thanks for watching!</b><button class="gl sm" data-replay>Replay</button></div>');
          scr.querySelector('[data-replay]').addEventListener('click', (e) => { e.stopPropagation(); scr.querySelector('.vp-end').remove(); t = 0; last = 0; raf = requestAnimationFrame(frame); });
        }
      };
      raf = requestAnimationFrame(frame);
      stops.push(() => cancelAnimationFrame(raf));
    };
    vp.querySelector('.vp-screen').addEventListener('click', start);
    vp.querySelector('.vp-btn').addEventListener('click', start);
  });
  return () => stops.forEach((f) => f());
}

function draw(g, t, sky, ground, col, montage, flashes, r) {
  const W = 320, H = 180;
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  // parallax hills
  g.fillStyle = ground;
  g.beginPath(); g.moveTo(0, H);
  for (let x = 0; x <= W; x += 20) g.lineTo(x, 130 + Math.sin((x + t * 40) / 40) * 10);
  g.lineTo(W, H); g.fill();
  if (!montage) {
    // a blob that hops around
    const x = 160 + Math.sin(t * 0.9) * 100;
    const y = 120 - Math.abs(Math.sin(t * 3)) * 50;
    const sq = 1 + Math.max(0, Math.cos(t * 6)) * 0.15;
    g.fillStyle = col;
    g.beginPath(); g.ellipse(x, y, 22 * sq, 22 / sq, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff';
    g.beginPath(); g.arc(x - 7, y - 6, 5, 0, 7); g.arc(x + 7, y - 6, 5, 0, 7); g.fill();
    g.fillStyle = '#000';
    g.beginPath(); g.arc(x - 6, y - 5, 2.4, 0, 7); g.arc(x + 8, y - 5, 2.4, 0, 7); g.fill();
    if (Math.floor(t) % 6 === 3) { g.fillStyle = '#fff'; g.font = 'bold 18px Impact, Arial'; g.fillText('LOL', x + 20, y - 26); }
    return;
  }
  // montage: crosshair sweeps, hitmarkers and big text
  const cx = 160 + Math.sin(t * 2.3) * 110, cy = 90 + Math.cos(t * 1.7) * 40;
  g.strokeStyle = '#fff'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(cx - 14, cy); g.lineTo(cx - 4, cy); g.moveTo(cx + 4, cy); g.lineTo(cx + 14, cy); g.moveTo(cx, cy - 14); g.lineTo(cx, cy - 4); g.moveTo(cx, cy + 4); g.lineTo(cx, cy + 14); g.stroke();
  if (r.next() < 0.03) flashes.push({ x: cx, y: cy, life: 0.6, text: r.pick(['+100', 'NO WAY', 'TRICKSHOT!!', 'OHHHH', '+50', 'SO CLEAN', 'WHAT']) });
  for (let i = flashes.length - 1; i >= 0; i--) {
    const f = flashes[i];
    f.life -= 0.033;
    if (f.life <= 0) { flashes.splice(i, 1); continue; }
    g.strokeStyle = '#fff';
    g.beginPath(); g.moveTo(f.x - 8, f.y - 8); g.lineTo(f.x - 3, f.y - 3); g.moveTo(f.x + 8, f.y - 8); g.lineTo(f.x + 3, f.y - 3); g.moveTo(f.x - 8, f.y + 8); g.lineTo(f.x - 3, f.y + 3); g.moveTo(f.x + 8, f.y + 8); g.lineTo(f.x + 3, f.y + 3); g.stroke();
    g.font = 'bold 22px Impact, Arial Black, sans-serif';
    g.fillStyle = Math.floor(f.life * 20) % 2 ? '#ff0' : '#f0f';
    g.fillText(f.text, 100 + (i * 37) % 80, 50 + (i * 23) % 60);
  }
  if (Math.floor(t * 2) % 2) { g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(0, 0, W, H); }
}
