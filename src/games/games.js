// Tiny playable games for Arcadeville. Each runs on a 320x240 canvas,
// works with touch, mouse or arrow keys, and stops when you leave the page.
const W = 320, H = 240;

function setup(canvas) {
  const g = canvas.getContext('2d');
  const inp = { x: W / 2, y: H / 2, down: false, taps: [], keys: {}, swipe: null };
  let sx = 0, sy = 0;
  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    return [(e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height)];
  };
  const pd = (e) => { e.preventDefault(); [inp.x, inp.y] = pos(e); inp.down = true; inp.taps.push([inp.x, inp.y]); [sx, sy] = [inp.x, inp.y]; try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ } };
  const pm = (e) => { [inp.x, inp.y] = pos(e); };
  const pu = (e) => {
    inp.down = false;
    const [x, y] = pos(e);
    const dx = x - sx, dy = y - sy;
    if (Math.abs(dx) > 18 || Math.abs(dy) > 18) inp.swipe = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  };
  const kd = (e) => {
    const k = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', ' ': 'space' }[e.key];
    if (k) { inp.keys[k] = true; inp.lastKey = k; e.preventDefault(); }
  };
  const ku = (e) => { const k = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', ' ': 'space' }[e.key]; if (k) inp.keys[k] = false; };
  canvas.addEventListener('pointerdown', pd);
  canvas.addEventListener('pointermove', pm);
  canvas.addEventListener('pointerup', pu);
  canvas.addEventListener('pointercancel', pu);
  window.addEventListener('keydown', kd);
  window.addEventListener('keyup', ku);
  const off = () => {
    canvas.removeEventListener('pointerdown', pd); canvas.removeEventListener('pointermove', pm);
    canvas.removeEventListener('pointerup', pu); canvas.removeEventListener('pointercancel', pu);
    window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
  };
  return { g, inp, off };
}

function loop(step) {
  let raf = 0, last = 0, on = true;
  const f = (t) => {
    if (!on) return;
    raf = requestAnimationFrame(f);
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
    last = t;
    step(dt);
  };
  raf = requestAnimationFrame(f);
  return () => { on = false; cancelAnimationFrame(raf); };
}

const txt = (g, s, x, y, size = 16, col = '#fff', align = 'center') => {
  g.font = `bold ${size}px Verdana, Arial, sans-serif`;
  g.textAlign = align;
  g.fillStyle = '#000'; g.fillText(s, x + 1, y + 1);
  g.fillStyle = col; g.fillText(s, x, y);
};
function blob(g, x, y, r, col, eyes = true) {
  g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  if (!eyes) return;
  g.fillStyle = '#fff'; g.beginPath(); g.arc(x - r * 0.35, y - r * 0.2, r * 0.28, 0, 7); g.arc(x + r * 0.35, y - r * 0.2, r * 0.28, 0, 7); g.fill();
  g.fillStyle = '#000'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.15, r * 0.13, 0, 7); g.arc(x + r * 0.4, y - r * 0.15, r * 0.13, 0, 7); g.fill();
}
function bomb(g, x, y, r) {
  g.fillStyle = '#222'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  g.strokeStyle = '#a66'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + r * 0.5, y - r * 0.7); g.lineTo(x + r, y - r * 1.3); g.stroke();
  g.fillStyle = '#ffcc00'; g.beginPath(); g.arc(x + r, y - r * 1.3, 2.5, 0, 7); g.fill();
}

// Every game: (canvas, o) -> stop(). o: { r, col, col2, bg, noun, score(n), over(n), sound(name) }

function catcher(canvas, o) {
  const { g, inp, off } = setup(canvas);
  let px = W / 2, items = [], t = 0, spawn = 0, score = 0, lives = 3, speed = 70;
  const stop = loop((dt) => {
    t += dt; spawn -= dt; speed += dt * 3;
    if (inp.keys.left) px -= 220 * dt; else if (inp.keys.right) px += 220 * dt; else px += (inp.x - px) * Math.min(1, dt * 12);
    px = Math.max(24, Math.min(W - 24, px));
    if (spawn <= 0) { spawn = Math.max(0.35, 1 - t / 60); items.push({ x: 16 + o.r.next() * (W - 32), y: -10, bad: o.r.chance(0.22), v: speed * (0.8 + o.r.next() * 0.5) }); }
    for (const it of items) it.y += it.v * dt;
    items = items.filter((it) => {
      if (it.y > H - 30 && it.y < H - 10 && Math.abs(it.x - px) < 30) {
        if (it.bad) { lives--; o.sound('bonk'); } else { score++; o.score(score); o.sound('blip'); }
        return false;
      }
      return it.y < H + 20;
    });
    g.fillStyle = o.bg; g.fillRect(0, 0, W, H);
    for (const it of items) it.bad ? bomb(g, it.x, it.y, 9) : blob(g, it.x, it.y, 10, o.col);
    g.fillStyle = o.col2; g.fillRect(px - 26, H - 24, 52, 12); g.fillRect(px - 26, H - 34, 6, 12); g.fillRect(px + 20, H - 34, 6, 12);
    txt(g, `Score ${score}`, 8, 20, 13, '#fff', 'left'); txt(g, '♥'.repeat(Math.max(0, lives)), W - 8, 20, 14, '#ff4d6d', 'right');
    if (lives <= 0) { stop(); off(); o.over(score); }
  });
  return () => { stop(); off(); };
}

function whack(canvas, o) {
  const { g, inp, off } = setup(canvas);
  const holes = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) holes.push({ x: 60 + c * 100, y: 70 + r * 66, up: 0, gold: false, hit: 0 });
  let time = 30, score = 0, spawn = 0.5;
  const stop = loop((dt) => {
    time -= dt; spawn -= dt;
    if (spawn <= 0) {
      spawn = Math.max(0.25, 0.7 - (30 - time) / 80);
      const h = o.r.pick(holes.filter((x) => x.up <= 0));
      if (h) { h.up = 0.7 + o.r.next() * 0.6; h.gold = o.r.chance(0.12); }
    }
    for (const h of holes) { h.up -= dt; h.hit = Math.max(0, h.hit - dt); }
    while (inp.taps.length) {
      const [x, y] = inp.taps.shift();
      for (const h of holes) if (h.up > 0 && Math.abs(x - h.x) < 34 && Math.abs(y - h.y) < 30) { score += h.gold ? 5 : 1; h.up = 0; h.hit = 0.25; o.score(score); o.sound('bonk'); }
    }
    g.fillStyle = o.bg; g.fillRect(0, 0, W, H);
    for (const h of holes) {
      g.fillStyle = '#3b2410'; g.beginPath(); g.ellipse(h.x, h.y + 16, 32, 11, 0, 0, 7); g.fill();
      if (h.up > 0) blob(g, h.x, h.y, 20, h.gold ? '#ffd700' : o.col);
      if (h.hit > 0) txt(g, h.gold ? '+5' : 'BONK!', h.x, h.y - 18, 14, '#ff0');
    }
    txt(g, `Score ${score}`, 8, 22, 13, '#fff', 'left'); txt(g, `Time ${Math.max(0, Math.ceil(time))}`, W - 8, 22, 13, '#fff', 'right');
    if (time <= 0) { stop(); off(); o.over(score); }
  });
  return () => { stop(); off(); };
}

function snake(canvas, o) {
  const { g, inp, off } = setup(canvas);
  const C = 16, GW = W / C, GH = H / C;
  let body = [[8, 7], [7, 7], [6, 7]], dir = [1, 0], next = [1, 0], food = [14, 7], acc = 0, score = 0, step = 0.16;
  const place = () => { do { food = [o.r.int(0, GW - 1), o.r.int(1, GH - 1)]; } while (body.some((b) => b[0] === food[0] && b[1] === food[1])); };
  const turn = (d) => {
    const m = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[d];
    if (m && (m[0] !== -dir[0] || m[1] !== -dir[1])) next = m;
  };
  const stop = loop((dt) => {
    if (inp.swipe) { turn(inp.swipe); inp.swipe = null; }
    if (inp.lastKey) { turn(inp.lastKey); inp.lastKey = null; }
    while (inp.taps.length) {
      const [x, y] = inp.taps.shift();
      const [hx, hy] = body[0];
      const dx = x - (hx * C + 8), dy = y - (hy * C + 8);
      if (dir[0] !== 0) turn(dy < 0 ? 'up' : 'down'); else turn(dx < 0 ? 'left' : 'right');
    }
    acc += dt;
    if (acc >= step) {
      acc = 0; dir = next;
      const h = [body[0][0] + dir[0], body[0][1] + dir[1]];
      if (h[0] < 0 || h[1] < 1 || h[0] >= GW || h[1] >= GH || body.some((b) => b[0] === h[0] && b[1] === h[1])) { stop(); off(); o.sound('bonk'); o.over(score); return; }
      body.unshift(h);
      if (h[0] === food[0] && h[1] === food[1]) { score++; o.score(score); o.sound('blip'); step = Math.max(0.07, step - 0.005); place(); } else body.pop();
    }
    g.fillStyle = o.bg; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 0, W, C);
    blob(g, food[0] * C + 8, food[1] * C + 8, 7, o.col2, false);
    body.forEach((b, i) => { g.fillStyle = i ? o.col : '#fff'; g.fillRect(b[0] * C + 1, b[1] * C + 1, C - 2, C - 2); });
    txt(g, `Length ${body.length}  Score ${score}`, 6, 12, 11, '#fff', 'left');
  });
  return () => { stop(); off(); };
}

function memory(canvas, o) {
  const { g, inp, off } = setup(canvas);
  const SH = ['circle', 'square', 'tri', 'star', 'heart', 'diamond', 'ring', 'cross'];
  const COL = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#ff6fb5'];
  const cards = o.r.shuffle([...Array(8).keys(), ...Array(8).keys()]).map((v, i) => ({ v, x: 20 + (i % 4) * 74, y: 18 + Math.floor(i / 4) * 54, open: false, done: false }));
  let first = null, wait = 0, moves = 0, found = 0, time = 0;
  const shape = (c) => {
    const cx = c.x + 32, cy = c.y + 23, s = 14;
    g.fillStyle = COL[c.v]; g.strokeStyle = COL[c.v]; g.lineWidth = 4;
    g.beginPath();
    switch (SH[c.v]) {
      case 'circle': g.arc(cx, cy, s, 0, 7); g.fill(); break;
      case 'square': g.fillRect(cx - s, cy - s, s * 2, s * 2); break;
      case 'tri': g.moveTo(cx, cy - s); g.lineTo(cx + s, cy + s); g.lineTo(cx - s, cy + s); g.fill(); break;
      case 'diamond': g.moveTo(cx, cy - s); g.lineTo(cx + s, cy); g.lineTo(cx, cy + s); g.lineTo(cx - s, cy); g.fill(); break;
      case 'ring': g.arc(cx, cy, s - 2, 0, 7); g.stroke(); break;
      case 'cross': g.moveTo(cx - s, cy - s); g.lineTo(cx + s, cy + s); g.moveTo(cx + s, cy - s); g.lineTo(cx - s, cy + s); g.stroke(); break;
      case 'heart': g.moveTo(cx, cy + s); g.bezierCurveTo(cx - s * 2, cy - s * 0.3, cx - s * 0.6, cy - s * 1.6, cx, cy - s * 0.4); g.bezierCurveTo(cx + s * 0.6, cy - s * 1.6, cx + s * 2, cy - s * 0.3, cx, cy + s); g.fill(); break;
      default: for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5 - Math.PI / 2, rr = i % 2 ? s * 0.45 : s; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.fill();
    }
  };
  const stop = loop((dt) => {
    time += dt;
    if (wait > 0) { wait -= dt; if (wait <= 0) cards.forEach((c) => { if (!c.done) c.open = false; }); inp.taps.length = 0; }
    while (inp.taps.length && wait <= 0) {
      const [x, y] = inp.taps.shift();
      const c = cards.find((k) => x > k.x && x < k.x + 64 && y > k.y && y < k.y + 46);
      if (!c || c.open || c.done) continue;
      c.open = true; o.sound('click');
      if (!first) first = c;
      else {
        moves++;
        if (first.v === c.v) { first.done = c.done = true; found++; o.sound('blip'); o.score(found * 10); }
        else wait = 0.7;
        first = null;
      }
    }
    g.fillStyle = o.bg; g.fillRect(0, 0, W, H);
    for (const c of cards) {
      g.fillStyle = c.open || c.done ? '#fff' : o.col; g.fillRect(c.x, c.y, 64, 46);
      g.strokeStyle = '#000'; g.lineWidth = 2; g.strokeRect(c.x, c.y, 64, 46);
      if (c.open || c.done) shape(c); else txt(g, '?', c.x + 32, c.y + 30, 18, '#fff');
    }
    txt(g, `Moves ${moves}   Pairs ${found}/8`, W / 2, H - 4, 12);
    if (found === 8) { stop(); off(); o.over(Math.max(10, 200 - moves * 5 - Math.floor(time))); }
  });
  return () => { stop(); off(); };
}

function dodge(canvas, o) {
  const { g, inp, off } = setup(canvas);
  let px = W / 2, blocks = [], spawn = 0, t = 0;
  const stop = loop((dt) => {
    t += dt; spawn -= dt;
    if (inp.keys.left) px -= 230 * dt; else if (inp.keys.right) px += 230 * dt; else px += (inp.x - px) * Math.min(1, dt * 14);
    px = Math.max(12, Math.min(W - 12, px));
    if (spawn <= 0) { spawn = Math.max(0.18, 0.7 - t / 50); const w = 16 + o.r.next() * 40; blocks.push({ x: o.r.next() * (W - w), y: -20, w, v: 90 + t * 4 + o.r.next() * 60 }); }
    for (const b of blocks) b.y += b.v * dt;
    blocks = blocks.filter((b) => b.y < H + 20);
    g.fillStyle = o.bg; g.fillRect(0, 0, W, H);
    g.fillStyle = o.col2; for (const b of blocks) g.fillRect(b.x, b.y, b.w, 14);
    blob(g, px, H - 18, 11, o.col);
    txt(g, `Time ${t.toFixed(1)}s`, 8, 20, 13, '#fff', 'left');
    o.score(Math.floor(t * 10));
    if (blocks.some((b) => b.y + 14 > H - 28 && b.y < H - 8 && px + 9 > b.x && px - 9 < b.x + b.w)) { stop(); off(); o.sound('bonk'); o.over(Math.floor(t * 10)); }
  });
  return () => { stop(); off(); };
}

function flyer(canvas, o) {
  const { g, inp, off } = setup(canvas);
  let y = H / 2, vy = 0, dist = 0, cols = [], gap = 130, center = H / 2, started = false;
  for (let x = 0; x <= W + 20; x += 20) cols.push({ x, c: center, gap });
  const stop = loop((dt) => {
    const up = inp.down || inp.keys.space || inp.keys.up;
    if (up) started = true;
    if (!started) { g.fillStyle = o.bg; g.fillRect(0, 0, W, H); drawCave(); blob(g, 70, y, 10, o.col); txt(g, 'Hold to fly up!', W / 2, H / 2 + 40, 14); return; }
    vy += (up ? -520 : 420) * dt; vy = Math.max(-220, Math.min(260, vy)); y += vy * dt;
    const sp = 110 + dist / 30;
    dist += sp * dt;
    for (const c of cols) c.x -= sp * dt;
    if (cols[0].x < -20) {
      cols.shift();
      center += (o.r.next() - 0.5) * 40; center = Math.max(70, Math.min(H - 70, center));
      gap = Math.max(74, 130 - dist / 60);
      cols.push({ x: cols[cols.length - 1].x + 20, c: center, gap });
    }
    g.fillStyle = o.bg; g.fillRect(0, 0, W, H);
    drawCave();
    blob(g, 70, y, 10, o.col);
    txt(g, `Distance ${Math.floor(dist / 10)}m`, 8, H - 8, 12, '#fff', 'left');
    o.score(Math.floor(dist / 10));
    const c = cols.find((k) => k.x <= 70 && k.x + 20 > 70) || cols[3];
    if (y - 9 < c.c - c.gap / 2 || y + 9 > c.c + c.gap / 2) { stop(); off(); o.sound('bonk'); o.over(Math.floor(dist / 10)); }
  });
  function drawCave() {
    g.fillStyle = o.col2;
    for (const c of cols) { g.fillRect(c.x, 0, 21, c.c - c.gap / 2); g.fillRect(c.x, c.c + c.gap / 2, 21, H); }
  }
  return () => { stop(); off(); };
}

function clicker(canvas, o) {
  const { g, inp, off } = setup(canvas);
  const st = o.load() || { n: 0, auto: 0, per: 1, fac: 0 };
  const ups = [
    { key: 'per', name: 'Mega Finger', cost: () => 25 * Math.pow(2, st.per - 1), y: 150 },
    { key: 'auto', name: `Auto-${o.noun}er`, cost: () => 15 + st.auto * 12, y: 180 },
    { key: 'fac', name: `${o.noun} Factory`, cost: () => 400 + st.fac * 250, y: 210 },
  ];
  let pop = 0, save = 0;
  const stop = loop((dt) => {
    st.n += (st.auto + st.fac * 10) * dt;
    pop = Math.max(0, pop - dt * 4);
    while (inp.taps.length) {
      const [x, y] = inp.taps.shift();
      if (Math.hypot(x - 90, y - 90) < 50) { st.n += st.per; pop = 1; o.sound('click'); }
      for (const u of ups) if (x > 170 && x < 314 && y > u.y - 20 && y < u.y + 6 && st.n >= u.cost()) { st.n -= u.cost(); st[u.key]++; o.sound('blip'); }
    }
    save += dt;
    if (save > 2) { save = 0; o.save(st); }
    o.score(Math.floor(st.n));
    g.fillStyle = o.bg; g.fillRect(0, 0, W, H);
    blob(g, 90, 90, 44 + pop * 6, o.col);
    txt(g, `${Math.floor(st.n)} ${o.noun}s`, 90, 170, 15);
    txt(g, `${(st.auto + st.fac * 10).toFixed(0)}/sec`, 90, 190, 11, '#ddd');
    txt(g, 'UPGRADES', 242, 125, 13, '#ff0');
    for (const u of ups) {
      const ok = st.n >= u.cost();
      g.fillStyle = ok ? o.col2 : '#555'; g.fillRect(170, u.y - 20, 144, 26);
      txt(g, `${u.name} (${st[u.key]})`, 176, u.y - 7, 10, '#fff', 'left');
      txt(g, `cost ${Math.ceil(u.cost())}`, 176, u.y + 4, 9, '#eee', 'left');
    }
    txt(g, 'Tap it!', 90, 24, 13);
  });
  return () => { o.save(st); stop(); off(); };
}

function breakout(canvas, o) {
  const { g, inp, off } = setup(canvas);
  let px = W / 2, bx = W / 2, by = H - 40, vx = 120, vy = -150, lives = 3, score = 0, stuck = true;
  let bricks = [];
  const reset = () => { bricks = []; for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) bricks.push({ x: 4 + c * 39, y: 26 + r * 14, alive: true, row: r }); };
  reset();
  const COL = [o.col, o.col2, '#f1c40f', '#2ecc71', '#3498db'];
  const stop = loop((dt) => {
    if (inp.keys.left) px -= 260 * dt; else if (inp.keys.right) px += 260 * dt; else px += (inp.x - px) * Math.min(1, dt * 16);
    px = Math.max(26, Math.min(W - 26, px));
    if (stuck) { bx = px; by = H - 28; if (inp.taps.length || inp.keys.space || inp.keys.up) { stuck = false; inp.taps.length = 0; vx = (o.r.next() - 0.5) * 200; vy = -170; } }
    else {
      bx += vx * dt; by += vy * dt;
      if (bx < 4 || bx > W - 4) { vx = -vx; bx = Math.max(4, Math.min(W - 4, bx)); }
      if (by < 4) { vy = Math.abs(vy); }
      if (by > H - 24 && by < H - 14 && Math.abs(bx - px) < 30 && vy > 0) { vy = -Math.abs(vy) * 1.02; vx = (bx - px) * 6; o.sound('blip'); }
      for (const b of bricks) if (b.alive && bx > b.x && bx < b.x + 36 && by > b.y && by < b.y + 11) { b.alive = false; vy = -vy; score += 10; o.score(score); o.sound('click'); break; }
      if (by > H + 10) { lives--; stuck = true; o.sound('bonk'); if (lives <= 0) { stop(); off(); o.over(score); return; } }
      if (!bricks.some((b) => b.alive)) { reset(); stuck = true; }
    }
    g.fillStyle = o.bg; g.fillRect(0, 0, W, H);
    for (const b of bricks) if (b.alive) { g.fillStyle = COL[b.row]; g.fillRect(b.x, b.y, 36, 11); }
    g.fillStyle = '#fff'; g.fillRect(px - 26, H - 20, 52, 7);
    blob(g, bx, by, 5, '#fff', false);
    txt(g, `Score ${score}`, 6, 16, 11, '#fff', 'left'); txt(g, '♥'.repeat(lives), W - 6, 16, 12, '#ff4d6d', 'right');
    if (stuck) txt(g, 'Tap to launch!', W / 2, H / 2 + 30, 13);
  });
  return () => { stop(); off(); };
}

export const MECHANICS = { catcher, whack, snake, memory, dodge, flyer, clicker, breakout };

export const HOWTO = {
  catcher: 'Move left and right (drag, tap or arrow keys) to catch the falling {noun}s. Avoid the bombs! You have 3 lives.',
  whack: 'Tap the {noun}s when they pop up! Golden ones are worth 5 points. You have 30 seconds.',
  snake: 'Swipe, tap or use the arrow keys to steer your hungry {noun}. Eat snacks to grow. Don\'t bite yourself!',
  memory: 'Flip two cards at a time and find all 8 matching pairs in as few moves as possible.',
  dodge: 'Drag left and right (or use the arrow keys) to dodge the falling blocks. Survive as long as you can!',
  flyer: 'Hold down (or press space) to fly up, let go to fall. Don\'t touch the cave walls!',
  clicker: 'Tap the giant {noun} to make more {noun}s. Buy upgrades to make {noun}s while you sleep. Progress is saved!',
  breakout: 'Move the paddle to bounce the ball and smash all the bricks. Tap to launch.',
};

export function mechanicFor(name, h) {
  const n = String(name).toLowerCase();
  if (/catch/.test(n)) return 'catcher';
  if (/whack|bonk|smash|bop/.test(n)) return 'whack';
  if (/hungry|snake|worm|noodle|slither/.test(n)) return 'snake';
  if (/memory|match|flip|pairs/.test(n)) return 'memory';
  if (/dodge|avoid|panic|escape/.test(n)) return 'dodge';
  if (/fly|copter|cave|jet|rocket|flap|glide/.test(n)) return 'flyer';
  if (/click|tycoon|idle|factory|empire/.test(n)) return 'clicker';
  if (/brick|bash|break|bounce/.test(n)) return 'breakout';
  const keys = Object.keys(MECHANICS);
  return keys[h % keys.length];
}
