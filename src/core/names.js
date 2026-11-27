// Generators for invented names: usernames, songs, bands, games, products.
import { LEX } from './lex.js';
import { cap } from './util.js';

const U_PRE = ['xX', 'Xx', 'x', 'Dark', 'Epic', 'Lil', 'Mr', 'Ms', 'Pro', 'Sir', 'Captain', 'The', 'Its', 'iAm', 'Real', 'Not', 'Big', 'Mega', 'Super', 'Da', 'King', 'Queen', 'Lady', 'Dr', 'Sgt', ''];
const U_CORE = [...LEX.coolNoun, ...LEX.sillyNoun, 'Gamer', 'Sniper', 'Pixel', 'Llama', 'Panda', 'Kitty', 'Bunny', 'Unicorn', 'Toaster', 'Ducky', 'Spork', 'Hamster', 'Penguin', 'Sloth', 'Waffles', 'Skater', 'Surfer', 'Angel', 'Princess', 'Monkey', 'Turtle', 'Otter', 'Goat', 'Burrito'];
const U_SUF = ['Xx', 'xX', '99', '2000', '2012', '_HD', '4life', '_lol', '123', '07', '96', '98', '_pwns', 'TV', '_x', 'Fan', '_rox', '13', '22', '42', '_official', 'Gamer', 'Girl', 'Boy', 'ster', 'zilla', '_', '', '', ''];

export function username(r) {
  const style = r.int(0, 9);
  const core = r.pick(U_CORE);
  const core2 = r.pick(U_CORE);
  switch (style) {
    case 0: return `xX${r.pick(LEX.colorNoun)}${core}Xx`;
    case 1: return `${r.pick(U_PRE)}${core}${r.pick(U_SUF)}`;
    case 2: return `${core.toLowerCase()}_${core2.toLowerCase()}${r.int(1, 99)}`;
    case 3: return `${r.pick(LEX.firstName)}${r.pick(['', '_', ''])}${r.pick(U_SUF)}`;
    case 4: return `${r.pick(LEX.colorNoun)}${core}${r.int(1, 999)}`;
    case 5: return `${core}${r.pick(['Lover', 'Fan', 'Master', 'Lord', 'Guy', 'Girl', 'Kid', 'Dude', 'Queen', 'King'])}${r.pick(['', r.int(1, 99)])}`;
    case 6: return `${r.pick(LEX.firstName).toLowerCase()}${r.pick(['.', '_', ''])}${r.pick(LEX.sillyNoun).toLowerCase()}`;
    case 7: return `${r.pick(['i', 'im', 'its'])}${cap(r.pick(LEX.animal).replace(/ /g, ''))}${r.pick(U_SUF)}`;
    case 8: return `~${r.pick(['sparkle', 'glitter', 'star', 'moon', 'angel', 'rainbow', 'cupcake'])}${r.pick(['girl', 'boy', 'kid', 'babe', 'heart'])}${r.int(1, 99)}~`;
    default: return `${r.pick(U_PRE)}${r.pick(LEX.coolNoun)}${r.pick(['_', ''])}${r.int(10, 9999)}`;
  }
}

export const personName = (r) => `${r.pick(LEX.firstName)} ${r.pick(LEX.lastName)}`;

const SONG_A = ['Electric', 'Midnight', 'Neon', 'Lonely', 'Dancing', 'Broken', 'Summer', 'Cosmic', 'Golden', 'Crazy', 'Sugar', 'Paper', 'Velvet', 'Thunder', 'Glitter', 'Rocket', 'Lemonade', 'Bubblegum', 'Disco', 'Rainy', 'Starlight', 'Turbo', 'Crystal', 'Pixel'];
const SONG_B = ['Heart', 'Dreams', 'Sky', 'Highway', 'Love', 'Nights', 'Summer', 'Rain', 'Fire', 'Waves', 'Kisses', 'Robots', 'Pancakes', 'Party', 'Shoes', 'Balloon', 'Galaxy', 'Rollercoaster', 'Sunset', 'Daydream', 'Moonlight', 'Toaster', 'Penguin', 'Hamster'];
const SONG_T = ['{a} {b}', '{a} {b}', 'My {b} Is {a}', '{b} on the Dancefloor', "Don't Stop the {b}", 'Baby {b}', '{a} {b} (Remix)', '{b} {b2}', 'Another {a} {b}', 'All My {b}', 'Hey {b}!', '{a} {b} (feat. {feat})', 'Turn Up the {b}', 'Love You Like a {b}', '{b} Song', '{a} Forever'];

export function songTitle(r) {
  return r.pick(SONG_T)
    .replace('{a}', r.pick(SONG_A))
    .replace('{b2}', r.pick(SONG_B))
    .replace('{b}', r.pick(SONG_B))
    .replace('{b}', r.pick(SONG_B))
    .replace('{feat}', r.pick(['Lil Waffle', 'DJ Toastmaster', 'MC Pancake', 'Big Noodle', 'Princess Sparkle']));
}

const BAND_A = ['The', 'DJ', 'MC', 'Lil', 'Big', 'Young', '', '', ''];
const BAND_B = [...SONG_A, 'Sonic', 'Atomic', 'Fuzzy', 'Velcro', 'Polka Dot', 'Laser', 'Moonbeam', 'Static'];
const BAND_C = ['Gophers', 'Pancakes', 'Robots', 'Ponies', 'Parade', 'Kittens', 'Sofas', 'Jellyfish', 'Turnips', 'Waffle', 'Noodle', 'Biscuits', 'Hamsters', 'Lunchboxes', 'Rockets', 'Unicorns', 'Toasters', 'Penguins', 'Sporks'];
export function bandName(r) {
  if (r.chance(0.35)) return r.pick(LEX.invBand);
  const a = r.pick(BAND_A);
  return `${a ? a + ' ' : ''}${r.pick(BAND_B)} ${r.pick(BAND_C)}`.trim();
}

const GAME_A = ['Super', 'Mega', 'Turbo', 'Ultra', 'Epic', 'Crazy', 'Tiny', 'Cosmic', 'Pixel', 'Jumbo', 'Ninja', 'Robo', 'Hyper', 'Space', 'Zombie', 'Rocket'];
const GAME_C = ['Panic', 'Mania', 'Frenzy', 'Rush', 'Dash', 'Blast', 'Madness', 'Catcher', 'Bonanza', 'Showdown', 'Escape', 'Attack', 'Quest', 'Adventure', 'Challenge', 'Tycoon', 'Party', 'Smash'];
export function miniGameName(r, noun) {
  const n = noun || r.pick([...LEX.sillyNoun, 'Hamster', 'Llama', 'Penguin', 'Toast', 'Duck', 'Blob', 'Gnome', 'Sock', 'Robot', 'Sloth']);
  const s = r.int(0, 4);
  if (s === 0) return `${r.pick(GAME_A)} ${n} ${r.pick(GAME_C)}`;
  if (s === 1) return `${n} ${r.pick(GAME_C)}${r.chance(0.4) ? ' ' + r.int(2, 5) : ''}`;
  if (s === 2) return `${r.pick(GAME_A)} ${n}${r.chance(0.5) ? ' ' + r.pick(['2', '3', 'Deluxe', 'XL', 'Online', 'HD']) : ''}`;
  if (s === 3) return `${n} ${r.pick(['Bonk', 'Toss', 'Hop', 'Drop', 'Run', 'Bounce', 'Stack', 'Fling', 'Jump'])}${r.chance(0.3) ? '!' : ''}`;
  return `${r.pick(['Attack of the', 'Revenge of the', 'Return of the', 'Night of the', 'Planet of the'])} ${n}s`;
}

export function productName(r) {
  if (r.chance(0.6)) return r.pick(LEX.invProduct);
  return `${r.pick(['Turbo', 'Mega', 'Insta', 'Ultra', 'Super', 'Magic', 'Smart', 'Power', 'Hyper', 'Pocket'])}${r.pick(['Clean', 'Glow', 'Snack', 'Boost', 'Zap', 'Fluff', 'Shine', 'Nap', 'Chill', 'Grip'])} ${r.pick(['3000', 'XL', 'Pro', 'Deluxe', '2.0', 'Max', 'Plus', '9000', 'Gold', ''])}`.trim();
}

const CLAN_A = ['Noodle', 'Shadow', 'Pickle', 'Thunder', 'Phantom', 'Waffle', 'Toxic', 'Frozen', 'Cosmic', 'Savage', 'Silent', 'Rabid', 'Crimson', 'Mighty', 'Turbo', 'Elite', 'Fuzzy', 'Feral', 'Epic', 'Dark'];
const CLAN_B = ['Ninjas', 'Wolves', 'Reapers', 'Knights', 'Vipers', 'Llamas', 'Squad', 'Legion', 'Snipers', 'Spartans', 'Dragons', 'Hamsters', 'Bandits', 'Assassins', 'Raptors', 'Pirates', 'Titans', 'Ghosts', 'Penguins', 'Gnomes'];
export function clanName(r) {
  const name = `${r.pick(CLAN_A)} ${r.pick(CLAN_B)}`;
  return name;
}
export function clanTag(name, r) {
  const initials = name.split(' ').map((w) => w[0]).join('').toUpperCase();
  return r.pick([initials, initials + 'x', 'x' + initials + 'x', name.split(' ')[0].slice(0, 4).toUpperCase(), initials + r.int(1, 9)]);
}

export const shotName = (r) => r.pick([
  'triple-spin noscope', 'ladder flick', 'the Pretzel', 'reverse quadfeed', 'bounce-pad flick', 'helicopter spin', 'the Sneaky Toaster', 'double kneel-slide', 'crate-hop clip', 'the Moonwalk', 'off-the-wall ricochet', 'upside-down flick', 'the Wiggle', '720 drop-shot', 'the Spaghetti Spin', 'blind wallbang', 'mid-air swap', 'the Pancake Flip', 'canswap trickshot', 'the Ninja Roll', 'jump-shot from the water tower', 'triple-bounce grenade', 'the Hamster Wheel',
]);

export const emailAddr = (name, host) => `${String(name).toLowerCase().replace(/[^a-z0-9._]+/g, '')}@${host}`;
