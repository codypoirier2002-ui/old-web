// The old computer: power button, BIOS check, OS splash, then dialing up
// to the internet. Skippable at any moment.
import { unlock, sfx, modem } from './audio.js';
import { kv } from './storage.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function bootMode(settings) {
  if (settings.boot === 'full' || settings.boot === 'quick' || settings.boot === 'off') return settings.boot;
  return kv.get('booted', 0) ? 'quick' : 'full';
}

export async function boot(app, browser, mode) {
  kv.set('booted', kv.get('booted', 0) + 1);
  if (mode === 'off') return;
  const el = document.createElement('div');
  el.className = 'boot';
  app.appendChild(el);
  let skipped = false;
  let stopModem = () => {};
  const skipBtn = () => '<button class="boot-skip" data-skip>Skip &raquo;</button>';
  const done = () => {
    stopModem();
    el.classList.add('out');
    setTimeout(() => el.remove(), 450);
  };
  const wait = async (ms) => { const end = Date.now() + ms; while (!skipped && Date.now() < end) await sleep(Math.min(50, end - Date.now())); return !skipped; };
  el.addEventListener('click', (e) => { if (e.target.closest('[data-skip]')) { skipped = true; sfx('click'); } });

  if (mode === 'quick') {
    el.innerHTML = dialHtml() + skipBtn();
    el.classList.add('desk');
    await dial(el, wait, 260);
    done();
    return;
  }

  // 1. power button (also unlocks sound on phones)
  el.innerHTML = `<div class="boot-power"><button class="pwr" data-power aria-label="Power on"><svg viewBox="0 0 24 24"><path d="M12 3v8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M7.2 6.3a7.5 7.5 0 1 0 9.6 0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button><p class="blink">Tap to turn on the computer</p><small>(sound on for the full experience)</small></div>`;
  await new Promise((resolve) => {
    const go = (e) => {
      if (e.type === 'keydown' && e.key === 'Tab') return;
      window.removeEventListener('keydown', go);
      unlock();
      resolve();
    };
    el.querySelector('[data-power]').addEventListener('click', go);
    el.addEventListener('pointerdown', (e) => { if (!e.target.closest('[data-power]')) go(e); }, { once: true });
    window.addEventListener('keydown', go);
  });
  sfx('blip');

  // 2. BIOS check
  el.innerHTML = `<div class="bios"><div class="bios-top"><b>PixelBIOS</b> v4.51PG, Powered by Mostly Electricity<br>Copyright (C) 1984-2012, Pixelsoft Inc.</div><pre class="bios-out"></pre></div>${skipBtn()}`;
  const out = el.querySelector('.bios-out');
  const line = (t) => { out.textContent += t + '\n'; };
  line('HEXIUM(R) Turbo CPU at 1.21 GHz');
  if (!(await wait(300))) return done();
  out.textContent += 'Memory Test :      0K';
  for (let k = 0; k <= 4194304 && !skipped; k += 262144) {
    out.textContent = out.textContent.replace(/Memory Test : +\d+K/, `Memory Test : ${String(k).padStart(7)}K`);
    await sleep(45);
  }
  out.textContent += ' OK\n\n';
  const checks = ['Detecting Primary Master ... HyperDisk 500GB', 'Detecting Primary Slave  ... None', 'Detecting CD-ROM ......... 52X SpinMaster', 'Keyboard ................. Detected', 'Mouse .................... Detected (it has a ball)', 'Modem .................... 56K FlexiVoice', '', 'Press DEL to enter SETUP (please don\'t)'];
  for (const c of checks) { if (!(await wait(170))) return done(); line(c); }
  if (!(await wait(500))) return done();

  // 3. OS splash
  sfx('chime');
  el.innerHTML = `<div class="os"><div class="os-logo"><span class="hex"></span><span class="os-name">Hexagon<b>OS</b> <i>7</i></span></div><div class="os-bar"><i></i></div><small>Starting up...</small></div>${skipBtn()}`;
  if (!(await wait(2300))) return done();

  // 4. dial-up
  el.innerHTML = dialHtml() + skipBtn();
  el.classList.add('desk');
  stopModem = modem();
  await dial(el, wait, 900);
  done();
}

function dialHtml() {
  return `<div class="dial"><div class="dial-t">Connect to the Internet</div><div class="dial-b"><div class="dial-pic"><span class="pc"></span><span class="dots"><i></i><i></i><i></i></span><span class="globe2"></span></div><div class="dial-s">Initializing modem...</div><div class="dial-bar"><i></i></div><div class="dial-f">User: netsurfer2012 &nbsp; Number: 555-0123</div></div></div>`;
}

async function dial(el, wait, step) {
  const s = el.querySelector('.dial-s');
  const bar = el.querySelector('.dial-bar i');
  const steps = ['Dialing 555-0123...', 'Waiting for answer...', 'Verifying username and password...', 'Logging on to network...', 'Connected at 56,000 bps!'];
  for (let i = 0; i < steps.length; i++) {
    if (!s) return;
    s.textContent = steps[i];
    bar.style.transform = `scaleX(${(i + 1) / steps.length})`;
    if (!(await wait(i === steps.length - 1 ? step * 0.8 : step * (i === 1 ? 1.6 : 1)))) return;
  }
}

// "Leaving the internet" screen from the window's close button.
export function shutdown(app, browser, onBack) {
  const el = document.createElement('div');
  el.className = 'boot off';
  el.innerHTML = '<div class="bye"><p>Thanks for surfing!</p><p>You may now unplug the Internet.</p><button class="gl orange" data-on>Turn it back on</button></div>';
  app.appendChild(el);
  sfx('lose');
  el.querySelector('[data-on]').addEventListener('click', () => { el.remove(); onBack(); });
}
