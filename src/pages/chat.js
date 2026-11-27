// Chatterbox chat rooms: a lobby, and rooms where the regulars keep talking
// while you watch. You can join in.
import { LEX } from '../core/lex.js';
import { HOSTS } from '../core/url.js';
import { fmt, titleCase, deslug, fmtTime, fakeToday } from '../core/util.js';
import { Rng } from '../core/rng.js';
import { esc, lnk, gl, each } from '../render/html.js';
import { page as P } from '../core/links.js';
import { kit, list, username } from './common.js';
import { kv } from '../browser/storage.js';

const ROOMS = [
  ['The Lobby', 'Say hi! Everyone starts here.'], ['Gamers Den', 'Talk games, brag about high scores.'], ['Music Lounge', 'What are you listening to?'],
  ['Homework Help', 'Stuck? Ask here. (No copying!)'], ['Random Chat', 'Anything goes. Mostly random.'], ['Pet Lovers', 'Hamsters, llamas, goldfish, all welcome.'],
  ['Night Owls', 'For people who should be asleep.'], ['Snack Talk', 'The most important topic.'], ['Movie Buffs', 'Spoilers must be marked!'], ['Art Corner', 'Share your doodles.'],
];
const LINES = [
  'hey everyone', 'sup', 'hiii', 'lol', 'brb {food}', 'back', 'anyone here from {town}?', 'who likes {band}?', 'omg {band} is the best', 'i just ate {food}',
  'my {animal} is sitting on my keyboard', 'anyone wanna play {game} later?', 'lol {user} you are so random', 'whats everyone doing', 'bored...', 'this room is so quiet today',
  'did u guys see that video of the {animal} on vidoodle', 'i have a {thing} collection now', 'hahaha', 'wb!', 'who changed the room topic lol', 'my mom says i have 10 more minutes',
  'is it just me or is the chat lagging', 'k', 'XD', ':D', 'anyone know how to {verb} a {thing}?', 'i think {food} is overrated', 'no way {food} is the best',
  'ok i am back', 'anybody wanna be friends?', 'gtg dinner', 'lolol', 'that is so {adj}', 'random fact: {animal:s} cannot {verb} {thing:s}', 'i love this chat room',
];
const ROOM_LINES = {
  'gamers-den': ['who beat level {n} in {game}?', 'my high score in arcadeville is {big}', 'anyone know the {game} cheat codes', 'gg', 'that boss is impossible'],
  'music-lounge': ['listening to {band} rn', 'has anyone heard the new {band} song', 'my favorite song is {song}', 'i can play {song} on the {instrument}'],
  'homework-help': ['what is 7 times 8', 'can someone explain fractions', 'my essay is about {topic} lol', 'whats the capital of {town}? jk'],
  'pet-lovers': ['my {animal} learned a new trick!!', 'what should i name my {animal}', 'post pics of ur pets', 'my {animal} is named {pet}'],
  'snack-talk': ['{food} or {food2}?', 'best snack ever: {food}', 'who puts {food} on {food2}', 'im so hungry now'],
};
const ACTIONS = ['does a little dance', 'waves', 'eats a {food}', 'throws a {thing} at {user}', 'falls asleep', 'high-fives everyone', 'hides behind a {thing}'];
const REPLY = {
  hi: ['hi {nick}!!', 'hey {nick}', 'welcome {nick} :)', 'sup {nick}', 'oh hai {nick}', 'heyyy'],
  q: ['idk', 'maybe?', 'yes definitely', 'no lol', 'good question', 'ask {user}', 'why do u ask', 'probably'],
  gen: ['lol', 'same', 'lol {nick}', 'haha', 'true', 'cool', 'totally', 'XD', 'wait what', 'agreed', '{nick} gets it', 'nice'],
};

function roomKit(ctx) { return kit(ctx, { song: (rr) => `"${rr.pick(['Electric Heart', 'Pancake Party', 'Midnight Robots', 'Turbo Summer'])}"`, instrument: LEX.instrument }); }

export const chatLobby = {
  gen(ctx) {
    const { r } = roomKit(ctx);
    return { online: r.big(400, 4000), rooms: ROOMS.map(([name, desc], i) => ({ name, desc, users: r.fork('u' + i).int(2, 80) })) };
  },
  title: () => 'Chatterbox - Free Chat Rooms!',
  render(c) {
    const nick = kv.get('nick', '');
    return `<div class="pg chat"><div class="ch-wrap">
  <div class="rv ch-head"><span class="ch-logo">${lnk(`http://${HOSTS.chat}/`, '', { html: 'Chatter<b>box</b>' })}</span><span>${fmt(c.online)} people chatting now!</span></div>
  <div class="rv ch-box"><b>Pick a nickname:</b> <input class="ch-nick" maxlength="20" value="${esc(nick)}" placeholder="CoolDude2012"> ${gl('Save', { act: 'nick', cls: 'sm' })}</div>
  <div class="rv ch-box"><h2>Chat Rooms</h2><table class="ch-rooms">${each(c.rooms, (rm) => `<tr><td>${lnk(P.room(rm.name), rm.name, { cls: 'ch-rn' })}<br><small>${esc(rm.desc)}</small></td><td class="n">${rm.users} users</td></tr>`)}</table></div>
  <div class="rv ch-box ch-rules"><h2>Rules</h2><ol><li>Be nice!</li><li>No spamming or CAPS LOCK</li><li>Never share your real name, address or phone number</li><li>Have fun!!</li></ol></div>
</div></div>`;
  },
  mount(el, c, ctx, api) {
    el.querySelector('[data-act="nick"]')?.addEventListener('click', () => {
      const v = el.querySelector('.ch-nick').value.trim().replace(/\s+/g, '_').slice(0, 20);
      if (!v) return;
      kv.set('nick', v);
      api.toast(`You are now known as ${v}`);
      api.sound('click');
    });
  },
};

export const chatRoom = {
  gen(ctx) {
    const k = roomKit(ctx);
    const { r, say } = k;
    const name = ctx.hint.t || titleCase(deslug(ctx.params.slug));
    const users = list(r.int(6, 10), (i) => username(r.fork('u' + i)).replace(/\s/g, '_'));
    const extra = ROOM_LINES[ctx.params.slug] || [];
    const script = [];
    for (let i = 0; i < 60; i++) {
      const rr = r.fork('l' + i);
      const user = rr.pick(users);
      const roll = rr.next();
      if (roll < 0.06) script.push({ type: 'join', user: username(rr) });
      else if (roll < 0.1) script.push({ type: 'leave', user });
      else if (roll < 0.17) script.push({ type: 'action', user, text: say(rr.pick(ACTIONS), { user: rr.pick(users) }) });
      else script.push({ type: 'msg', user, text: say(extra.length && rr.chance(0.4) ? rr.pick(extra) : rr.pick(LINES), { user: rr.pick(users) }) });
    }
    return { name, topic: say(['Welcome to {room}! Be nice :)', 'Topic: {food} vs {food2}. Discuss.', 'No spamming!! -mgmt', 'Today\'s topic: {topic}'], { room: name }), users, script };
  },
  title: (c) => `${c.name} - Chatterbox`,
  render(c) {
    return `<div class="pg chat"><div class="ch-wrap">
  <div class="rv ch-head"><span class="ch-logo">${lnk(`http://${HOSTS.chat}/`, '', { html: 'Chatter<b>box</b>' })}</span><span>${esc(c.name)}</span></div>
  <div class="rv ch-room">
    <div class="ch-topic"><b>Topic:</b> ${esc(c.topic)}</div>
    <div class="ch-body"><div class="ch-log" aria-live="polite"></div><div class="ch-users"><b>${c.users.length + 1} users</b>${each(c.users, (u) => `<div>${esc(u)}</div>`)}<div class="me" data-me></div></div></div>
    <form class="ch-say" data-say><input name="msg" maxlength="200" autocomplete="off" enterkeyhint="send" placeholder="Type a message... (/help for commands)"><button class="gl sm" type="submit">Send</button></form>
  </div>
  <div class="rv ch-box"><small>${lnk(`http://${HOSTS.chat}/`, 'Back to room list')} &middot; Remember: never share personal info in chat rooms!</small></div>
</div></div>`;
  },
  mount(el, c, ctx, api) {
    const log = el.querySelector('.ch-log');
    const nick = kv.get('nick', '') || 'Guest' + (1000 + Math.floor(Math.random() * 9000));
    el.querySelector('[data-me]').textContent = nick;
    const r = new Rng(ctx.url + Date.now());
    const k = roomKit({ ...ctx, r });
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); };
    const time = () => fmtTime(fakeToday());
    const add = (line, mine) => {
      const div = document.createElement('div');
      div.className = 'ch-l ch-' + line.type + (mine ? ' mine' : '');
      if (line.type === 'msg') div.innerHTML = `<span class="ch-t">[${time()}]</span> <b style="color:${color(line.user)}">&lt;${esc(line.user)}&gt;</b> ${esc(line.text)}`;
      else if (line.type === 'action') div.innerHTML = `<span class="ch-t">[${time()}]</span> <i>* ${esc(line.user)} ${esc(line.text)}</i>`;
      else if (line.type === 'join') div.innerHTML = `<span class="ch-t">[${time()}]</span> <span class="ch-sys">*** ${esc(line.user)} has joined ${esc(c.name)}</span>`;
      else if (line.type === 'leave') div.innerHTML = `<span class="ch-t">[${time()}]</span> <span class="ch-sys">*** ${esc(line.user)} has left (${esc(line.reason || 'Quit')})</span>`;
      else div.innerHTML = `<span class="ch-sys">${esc(line.text)}</span>`;
      const atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 40;
      log.appendChild(div);
      while (log.childNodes.length > 120) log.removeChild(log.firstChild);
      if (atBottom || mine) log.scrollTop = log.scrollHeight;
    };
    // recent history, then the room keeps going
    c.script.slice(0, 6).forEach((l) => add(l));
    add({ type: 'join', user: nick });
    let i = 6;
    const tick = () => {
      const line = i < c.script.length ? c.script[i++] : { type: 'msg', user: r.pick(c.users), text: k.say(r.pick(LINES), { user: r.pick(c.users) }) };
      add(line);
      if (line.type === 'msg' && r.chance(0.15)) api.sound('pop');
      later(tick, 1400 + r.int(0, 3200));
    };
    later(tick, 900);
    later(() => add({ type: 'msg', user: r.pick(c.users), text: k.say(r.pick(REPLY.hi), { nick }) }), 2200);

    const form = el.querySelector('[data-say]');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = form.msg.value.trim().slice(0, 200);
      if (!text) return;
      form.msg.value = '';
      if (text.startsWith('/')) return command(text);
      add({ type: 'msg', user: nick, text }, true);
      api.sound('click');
      const who = c.users.find((u) => text.toLowerCase().includes(u.toLowerCase()));
      const pool = /^(hi|hey|hello|sup|yo|hiya|howdy)\b/i.test(text) ? REPLY.hi : /\?\s*$/.test(text) ? REPLY.q : REPLY.gen;
      if (who || r.chance(0.75)) later(() => add({ type: 'msg', user: who || r.pick(c.users), text: k.say(r.pick(pool), { nick, user: r.pick(c.users) }) }), 900 + r.int(0, 2200));
      if (text === text.toUpperCase() && /[A-Z]{6,}/.test(text)) later(() => add({ type: 'sys', text: `*** ChatBot: ${nick}, please turn off caps lock. Thank you!` }), 600);
    });
    const command = (cmd) => {
      const [name, ...rest] = cmd.slice(1).split(' ');
      const arg = rest.join(' ').trim();
      if (name === 'help') add({ type: 'sys', text: '*** Commands: /me <action>, /nick <name>, /dance, /clear, /users' });
      else if (name === 'me' && arg) add({ type: 'action', user: nick, text: arg }, true);
      else if (name === 'nick' && arg) { const n = arg.replace(/\s+/g, '_').slice(0, 20); add({ type: 'sys', text: `*** ${nick} is now known as ${n}` }); kv.set('nick', n); }
      else if (name === 'dance') { add({ type: 'action', user: nick, text: 'starts a dance party' }, true); c.users.slice(0, 4).forEach((u, j) => later(() => add({ type: 'action', user: u, text: r.pick(['dances', 'does the robot', 'moonwalks', 'does the sprinkler', 'breakdances badly']) }), 500 + j * 500)); }
      else if (name === 'clear') log.innerHTML = '';
      else if (name === 'users') add({ type: 'sys', text: `*** Users here: ${c.users.join(', ')}, ${nick}` });
      else add({ type: 'sys', text: `*** Unknown command: /${name}. Type /help` });
    };
    return () => { timers.forEach(clearTimeout); timers.clear(); };
  },
};

const COLORS = ['#c0392b', '#2980b9', '#27ae60', '#8e44ad', '#d35400', '#16a085', '#c71585', '#2c3e50', '#b8860b'];
const color = (name) => COLORS[[...String(name)].reduce((a, ch) => a + ch.charCodeAt(0), 0) % COLORS.length];
