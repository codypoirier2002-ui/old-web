// Little surprises. (Shh.)
import { kv } from './storage.js';
import { sfx } from './audio.js';
import { shutdown, boot } from './boot.js';

const ROCK_LINES = ['is doing great. It has not moved.', 'says: ...', 'is napping. As usual.', 'enjoyed that web page.', 'would like a snack. It will not eat it.', 'is the best rock.'];

export function petRock(b) {
  const rock = kv.get('petrock', null);
  b.root.querySelector('.rock')?.remove();
  if (!rock) return;
  const s = document.createElement('span');
  s.className = 'panel rock';
  s.title = `${rock.name} the pet rock`;
  s.innerHTML = '<i></i>';
  s.addEventListener('click', () => { sfx('pop'); b.toast(`${rock.name} ${ROCK_LINES[Math.floor(Math.random() * ROCK_LINES.length)]}`); });
  b.root.querySelector('.status .zone').before(s);
}

export function installEggs(b, app) {
  // the spinning logo knows a trick
  if (kv.get('skin', '') === 'classic') b.el.win.classList.add('skin-classic');
  let taps = [];
  b.el.throb.addEventListener('click', () => {
    const now = Date.now();
    taps = taps.filter((t) => now - t < 2500).concat(now);
    if (taps.length >= 7) {
      taps = [];
      const on = b.el.win.classList.toggle('skin-classic');
      kv.set('skin', on ? 'classic' : '');
      sfx('win');
      b.toast(on ? 'NetSkipper Classic Edition unlocked!' : 'Back to the shiny 2012 look.');
    }
  });
  // hit counters can only count so high
  b.el.page.addEventListener('click', (e) => {
    const c = e.target.closest('.ctr');
    if (!c) return;
    c._taps = (c._taps || 0) + 1;
    if (c._taps === 5) {
      c.innerHTML = '999999'.split('').map((d, i) => `<i style="animation-delay:${i * 80}ms">${d}</i>`).join('');
      c.classList.remove('roll'); void c.offsetWidth; c.classList.add('roll');
      sfx('win');
      b.toast('Whoa. You broke the hit counter.');
    }
  });
  petRock(b);
  // the window buttons
  b.svc.windowButton = async (which) => {
    if (which === 'min') { sfx('error'); b.toast('You can\'t minimize the Internet!'); }
    else if (which === 'max') { b.el.win.classList.toggle('max'); sfx('click'); }
    else if (which === 'close') {
      const r = await b.alert('Are you sure you want to leave the Internet?', 'NetSkipper', ['Stay', 'Leave']);
      if (r === 1) shutdown(app, b, () => boot(app, b, 'full'));
    }
  };
}

// Searching for certain words does certain things.
export function searchEggs(root, page, api) {
  if (page.type !== 'results') return;
  const q = String((page.params && page.params.q) || '').toLowerCase();
  if (/\bdisco\b/.test(q)) { root.classList.add('egg-disco'); sfx('win'); }
  if (/\b(snow|snowflakes?)\b/.test(q)) {
    const box = document.createElement('div');
    box.className = 'egg-snow';
    box.innerHTML = Array.from({ length: 28 }, (_, i) => `<i style="left:${(i * 37) % 100}%;animation-delay:${((i * 0.73) % 6).toFixed(2)}s;animation-duration:${(5 + (i % 5)).toFixed(1)}s"></i>`).join('');
    api.overlay.appendChild(box);
  }
}
