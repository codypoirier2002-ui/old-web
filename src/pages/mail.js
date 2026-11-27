// MailMole webmail: an inbox full of chain letters, forwards and "prizes".
import { LEX } from '../core/lex.js';
import { HOSTS } from '../core/url.js';
import { titleCase, deslug, cap, daysAgo, fmtShort, fmtDate, fmtTime, slug } from '../core/util.js';
import { Rng } from '../core/rng.js';
import { esc, lnk, gl, each, paras } from '../render/html.js';
import { page as P } from '../core/links.js';
import { kit, list, personName } from './common.js';
import { miniGameName } from '../core/names.js';
import { kv } from '../browser/storage.js';

export const ME = 'netsurfer2012@mailmole.com';
const MAILBOX = `http://${HOSTS.mail}/`;

// Each kind: [from, subject templates, body builder]
const KINDS = {
  chain: { from: ['Aunt {first}', '{first} {last}', 'Grandma', 'Cousin {first}'], subj: ['FW: FW: FW: FW: send this to 10 people!!!', 'Fwd: Fwd: THIS IS NOT A JOKE', 'FW: the Lucky {animal:title} of {town}', 'Fwd: DO NOT DELETE!!! read this'] },
  joke: { from: ['Uncle {first}', '{first} {last}', 'Dad'], subj: ['FW: this is hilarious lol', 'Fwd: Fwd: funny!!', 'FW: why did the {animal} cross the road', 'Fwd: you have to read this one'] },
  prize: { from: ['Prize Department', 'Winner Notification Center', 'The {product} Team'], subj: ['CONGRATULATIONS!!! You have WON a free {product}!!!', 'You are our 1,000,000th visitor!!!', 'Your FREE {thing} is waiting', 'Claim your prize before Friday!!!'] },
  prince: { from: ['Prince {first} of Lower Spoonland', 'Duke {last} III', 'Barrister {first} {last}'], subj: ['URGENT BUSINESS PROPOSAL', 'Confidential: {big} {food} need your help', 'Dear Friend, a once in a lifetime opportunity'] },
  newsletter: { from: ['{product} News', 'StartBlaster! Daily', 'HowToTown Weekly', 'Vidoodle'], subj: ['{product} Weekly: now in {color}!', 'Your daily horoscope is here', 'Top 10 guides this week', 'Videos we think you\'ll love'] },
  forum: { from: ['{Topic} Talk', 'BoardBuddy Notifier'], subj: ['[{Topic} Talk] New reply to your topic', '[{Topic} Talk] You have a private message', 'Welcome to {Topic} Talk!'] },
  friend: { from: ['{first}', '{first} {last}', '{user}'], subj: ['hey', 'did u see this??', 'lol', 'omg', 're: saturday', 'check out this video'] },
  mom: { from: ['Mom'], subj: ['Fwd: Fwd: Pictures of Uncle {first}\'s new {thing}', 'CALL ME', 'how do i make the letters small again', 'Re: Re: Re: dinner sunday'] },
  game: { from: ['Arcadeville', 'Arcadeville High Scores'], subj: ['Your high score in {game2} was beaten!', 'New games this week at Arcadeville!'] },
  party: { from: ['{first} {last}'], subj: ['You\'re invited to {first}\'s {thing} party!!', 'Party at my house saturday!!!'] },
};

const CHAIN = [
  'This is the Lucky {animal:title} of {town}. It has been sent around the world {n} times. Send this to 10 friends within 10 minutes or your {thing:s} will go missing for a week.\n\nMy cousin did not send it and his {thing} ran away. It came back but it was never the same.\n\nSend it to 5 friends and something {adj} will happen tomorrow. Send it to 10 and you will find {food} in your pocket.\n\nTHIS IS REAL!!! DO NOT BREAK THE CHAIN!!!',
  'Hi!! This email is for testing the internet. The internet is very full right now and needs to be cleaned. Please forward this to everyone you know so the internet people know you are still using it.\n\nIf you do not forward, your email will be turned into a {thing}. Sorry, those are the rules.',
  'A little {animal} was walking down the road. It was sad. Then it got this email. Now it is happy.\n\nForward this to 7 people and make a {animal} happy today.\n\n* Forward to 0 people: nothing happens.\n* Forward to 3 people: you will have a nice day.\n* Forward to 10 people: you will win at {game}.',
];
const JOKES = [
  'Why did the {animal} cross the road?\n\nTo get to the {food}!!!\n\nLOL I almost fell off my chair.',
  'What do you call a {thing} that tells jokes?\n\nA pun-{thing}!\n\nok it is better when my coworker tells it.',
  'A {animal}, a {person} and a {thing} walk into a {place}. The {place} says "is this some kind of joke?"\n\nhahahahahahaha',
  'Knock knock.\nWho\'s there?\n{food:cap}.\n{food:cap} who?\n{food:cap} you glad I forwarded this?',
];
const BODIES = {
  prize: 'Dear Lucky Winner,\n\nCONGRATULATIONS!!! You have been randomly selected out of {big} people to receive a FREE {product}!!!\n\nTo claim your prize, simply believe in yourself. That is the prize. You have it now.\n\nBest regards,\nThe Prize Department\n\n(This is not a scam. Scams have better spelling.)',
  prince: 'Dear Friend,\n\nI am Prince {first} of the Kingdom of Lower Spoonland. I write to you with an urgent and very confidential matter.\n\nMy kingdom has a surplus of {big} {food}, and I require a trustworthy person to help me eat them. In return I am prepared to offer you 30% of the {food}.\n\nPlease reply with your favorite {food} topping so we may proceed.\n\nYours in snack-related business,\nPrince {first}\n\nP.S. I also have a {animal}. It is not part of the deal.',
  newsletter: 'This week at {product}: brand-new colors, a brand-new smell, and the same great {thing}-related features you love!\n\n* NEW: {product} in {color}\n* Tip of the week: {tip}\n* Fan photo of the week: a {animal} using {product}\n\nYou are receiving this because you signed up in 2009 and forgot.',
  forum: 'Hello netsurfer2012,\n\n{user} has replied to your topic "Is {food} a {thing}?" on {Topic} Talk.\n\nTheir reply: "{reply}"\n\nThere may be other replies, but you will not receive any more notifications until you visit the board again.\n\nThanks,\nThe {Topic} Talk Team',
  friend: 'hey!!\n\n{line}\n\nanyway what r u doing saturday? me and {first} are going to {place}. u should come!!\n\nttyl\n{sender}',
  mom: 'Hi honey,\n\nThis is your mother. {line}\n\nAlso how do you turn off the caps lock. I think I fixed it.\n\nCall me.\nLove, Mom\n\nP.S. your {person} says hi',
  game: 'Hi netsurfer2012!\n\nBad news: {user} just beat your high score in {game2}! Your score: {n}0. Their score: {big}0.\n\nWill you let them get away with this?? Click below to play now!\n\n- The Arcadeville Team',
  party: 'YOU\'RE INVITED!!!\n\nWhat: {first}\'s {thing} Party\nWhere: my house (the one with the {thing} on the lawn)\nWhen: Saturday 2pm\nBring: {food} and a {thing}\n\nThere will be a {animal}. Maybe. My dad is still deciding.\n\nRSVP!!!',
};
const FRIEND_LINE = ['did u see that video of the {animal} lol', 'i found the funniest website ever', 'omg i cant believe what happened at school today', 'have u played {game2} yet?? its so addicting'];
const MOM_LINE = ['Your aunt sent me this and I thought of you.', 'Did you eat lunch today?', 'I am using the computer at the library. Everyone says hi.', 'I joined Vidoodle. My username is MomOf2Kids1960. Subscribe to me.'];

function mailKit(ctx) {
  return kit(ctx, { first: LEX.firstName, last: LEX.lastName, person: LEX.person, game2: () => miniGameName(ctx.r), tip: () => ctx.r.pick(['Store it in a cool, dry place', 'Never feed it after midnight (jk)', 'Polish it weekly']), reply: ['lol no', 'you are so right', 'I disagree but I respect you', 'pics?', 'this.'] });
}

function kindOfSubject(s) {
  const t = String(s).toLowerCase();
  if (/won|winner|prize|congrat|free|claim|visitor/.test(t)) return 'prize';
  if (/urgent|proposal|confidential|opportunity|dear friend/.test(t)) return 'prince';
  if (/joke|funny|hilarious|cross the road|knock/.test(t)) return 'joke';
  if (/fw|fwd|forward|chain|lucky|not a joke|do not delete|send this/.test(t)) return 'chain';
  if (/reply to your topic|private message|welcome to .* talk/.test(t)) return 'forum';
  if (/high score|arcadeville|games this week/.test(t)) return 'game';
  if (/invited|party/.test(t)) return 'party';
  if (/mom|call me|letters small|dinner/.test(t)) return 'mom';
  if (/weekly|horoscope|newsletter|guides|videos we/.test(t)) return 'newsletter';
  return 'friend';
}

export const inbox = {
  gen(ctx) {
    const r = new Rng('mailbox'); // everyone's inbox starts the same, it's "yours"
    const kk = mailKit({ ...ctx, r });
    const order = ['chain', 'friend', 'prize', 'joke', 'mom', 'forum', 'prince', 'newsletter', 'game', 'chain', 'party', 'friend', 'joke', 'newsletter', 'chain'];
    const folder = ctx.params.folder || 'inbox';
    const emails = order.map((kind, i) => {
      const rr = r.fork('m' + i + folder);
      const K = KINDS[kind];
      const Topic = titleCase(rr.pick(['hamster', 'toaster', 'kazoo', 'pickle', 'llama']));
      const subject = kk.say(rr.pick(K.subj), { Topic });
      const from = kk.say(rr.pick(K.from), { Topic });
      const d = daysAgo(Math.floor(i * 1.7));
      return { from, subject, date: i === 0 ? fmtTime(d) : fmtShort(d), unread: i < 6 };
    });
    return { folder, emails, used: r.int(2, 9), spam: r.int(120, 400) };
  },
  title: () => 'MailMole - Inbox',
  render(c, ctx) {
    const read = new Set(kv.get('mailRead', []));
    const deleted = new Set(kv.get('mailDeleted', []));
    c.emails.forEach((e, i) => { e.id = `${i + 1}-${slug(e.subject, 40)}`; });
    const folderName = titleCase(deslug(c.folder));
    const sent = (ctx.state && ctx.state.sent) || [];
    let rows;
    if (c.folder === 'inbox') rows = c.emails.filter((e) => !deleted.has(e.id)).map((e) => `<tr class="${e.unread && !read.has(e.id) ? 'unread' : ''}"><td class="mm-chk"><input type="checkbox" aria-label="select"></td><td class="mm-from">${esc(e.from)}</td><td class="mm-subj">${lnk(P.email(e.id), e.subject, { t: e.subject, from: e.from })}</td><td class="mm-date">${esc(e.date)}</td></tr>`).join('');
    else if (c.folder === 'sent') rows = sent.length ? sent.map((s) => `<tr><td class="mm-chk"></td><td class="mm-from">To: ${esc(s.to)}</td><td class="mm-subj">${esc(s.subject)}</td><td class="mm-date">${esc(s.date)}</td></tr>`).join('') : '<tr><td colspan="4" class="mm-empty">No sent messages. Write to someone!</td></tr>';
    else if (c.folder === 'spam') rows = list(6, (i) => `<tr><td class="mm-chk"></td><td class="mm-from">${esc(['Mr. Lucky', 'BEST DEALS', 'Your Computer', 'Prize Center', 'Sock Outlet', 'Dr. Feelgood Gummies'][i])}</td><td class="mm-subj">${esc(['Y0U W0N!!!', 'Cheap socks 4 u', 'Your computer is too slow (we checked)', 'Final notice: your prize is lonely', '90% off all socks', 'Feel 12% happier today'][i])}</td><td class="mm-date">${fmtShort(daysAgo(i))}</td></tr>`).join('');
    else rows = `<tr><td colspan="4" class="mm-empty">This folder is empty.</td></tr>`;
    const unread = c.emails.filter((e) => e.unread && !read.has(e.id) && !deleted.has(e.id)).length;
    return `<div class="pg mail"><div class="mm-wrap">
  <div class="rv mm-head"><span class="mm-logo">${lnk(MAILBOX, '', { html: 'Mail<b>Mole</b>' })}</span><span class="mm-me">${esc(ME)} | <a data-act="signout">Sign out</a></span></div>
  <div class="mm-cols"><div class="rv mm-side">
    ${gl('Compose', { act: 'compose', cls: 'orange' })}
    <ul class="mm-folders"><li class="${c.folder === 'inbox' ? 'on' : ''}">${lnk(MAILBOX, `Inbox${unread ? ` (${unread})` : ''}`)}</li><li class="${c.folder === 'sent' ? 'on' : ''}">${lnk(MAILBOX + 'folder/sent', 'Sent')}</li><li class="${c.folder === 'drafts' ? 'on' : ''}">${lnk(MAILBOX + 'folder/drafts', 'Drafts')}</li><li class="${c.folder === 'spam' ? 'on' : ''}">${lnk(MAILBOX + 'folder/spam', `Spam (${c.spam})`)}</li><li class="${c.folder === 'trash' ? 'on' : ''}">${lnk(MAILBOX + 'folder/trash', 'Trash')}</li></ul>
    <div class="mm-quota">You are using ${c.used}% of your 2048 MB<div class="mm-qbar"><i style="width:${c.used}%"></i></div></div>
  </div>
  <div class="rv mm-main"><div class="mm-tools"><b>${esc(folderName)}</b> <button class="btn-ui" data-act="del">Delete</button> <button class="btn-ui" data-act="spam">Spam</button> <button class="btn-ui" data-act="refresh">Check Mail</button></div>
    <table class="mm-list">${rows}</table>
  </div></div>
  <div class="rv mm-foot">&copy; 2012 MailMole &middot; Free email for life (or until the mole retires)</div>
</div></div>`;
  },
  mount(el, c, ctx, api) {
    return mountMail(el, ctx, api);
  },
};

function mountMail(el, ctx, api) {
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'compose') compose(el, api);
    else if (act === 'signout') api.alert('You cannot sign out. You live here now. (Your session is saved automatically.)', 'MailMole');
    else if (act === 'refresh') api.toast('No new messages. Even the chain letters are taking a break.');
    else if (act === 'del' || act === 'spam') {
      const rows = [...el.querySelectorAll('.mm-list input:checked')].map((x) => x.closest('tr'));
      if (!rows.length) { api.toast('Select some messages first (tick the boxes).'); return; }
      const ids = rows.map((row) => row.querySelector('[data-go]')?.dataset.go.split('/').pop()).filter(Boolean);
      kv.set('mailDeleted', [...new Set(kv.get('mailDeleted', []).concat(ids))]);
      rows.forEach((row) => row.remove());
      api.sound('click');
      api.toast(act === 'spam' ? 'Reported as spam. The spam is very sorry.' : 'Moved to Trash.');
    }
  });
}

function compose(el, api) {
  if (el.querySelector('.mm-compose')) return;
  const box = document.createElement('div');
  box.className = 'mm-compose';
  box.innerHTML = `<div class="mm-ch">New Message <button class="dlg-x" data-x aria-label="Close">&#10005;</button></div><form><input name="to" placeholder="To:" autocomplete="off" required><input name="subject" placeholder="Subject:" autocomplete="off"><textarea name="body" rows="5" placeholder="Write your message..."></textarea><div>${gl('Send', { type: 'submit', cls: 'sm' })}</div></form>`;
  api.overlay.appendChild(box);
  box.querySelector('[data-x]').addEventListener('click', () => box.remove());
  box.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const d = new Date();
    const sent = (api.state().sent || []).concat({ to: f.to.value.slice(0, 60), subject: f.subject.value.slice(0, 80) || '(no subject)', date: fmtTime(d) }).slice(-30);
    api.save({ sent });
    box.remove();
    api.sound('ding');
    api.alert(/@/.test(f.to.value) ? 'Message sent! It is traveling through the tubes as we speak.' : 'Message sent... somewhere. (Tip: email addresses usually have an @ in them.)', 'MailMole');
  });
}

export const email = {
  gen(ctx) {
    const k = mailKit(ctx);
    const { r, say } = k;
    const subject = ctx.hint.t || cap(deslug(String(ctx.params.id).replace(/^\d+-/, '')));
    const kind = kindOfSubject(subject);
    const Topic = (subject.match(/\[(\w+) Talk\]/) || [])[1] || titleCase(r.pick(['hamster', 'toaster', 'kazoo', 'pickle']));
    const from = ctx.hint.from || say(r.pick(KINDS[kind].from), { Topic });
    const v = { sender: from.split(' ')[0], line: say(r.pick(kind === 'mom' ? MOM_LINE : FRIEND_LINE)), Topic };
    let body;
    if (kind === 'chain') body = say(r.pick(CHAIN));
    else if (kind === 'joke') body = say(r.pick(JOKES));
    else body = say(BODIES[kind], v);
    let fwd = [];
    if (kind === 'chain' || kind === 'joke') fwd = list(r.int(2, 4), (i) => ({ from: personName(r.fork('f' + i)), note: r.fork('n' + i).pick(['', 'this is so true!!', 'lol', 'pass it on!!!', 'Sending to everyone just in case', 'I DID IT DONT BREAK IT']) }));
    const d = daysAgo(r.int(0, 20));
    d.setHours(r.int(6, 23), r.int(0, 59));
    const linkTitle = kind === 'friend' && /video/.test(v.line) ? say('{animal} vs {thing} (ORIGINAL)') : kind === 'game' ? miniGameName(r) : '';
    return { subject, from, fromAddr: `${slug(from).replace(/-/g, '.')}@${r.pick(['mailmole.com', 'zipmail.net', 'webpost.org', 'chirpmail.com'])}`, date: `${fmtDate(d)} ${fmtTime(d)}`, body, fwd, kind, linkTitle };
  },
  title: (c) => `${c.subject} - MailMole`,
  render(c) {
    const fwdBlocks = c.fwd.map((f, i) => `<div class="mm-fwd" style="margin-left:${Math.min(i, 3) * 10}px">---------- Forwarded message ----------<br>From: ${esc(f.from)}<br>${f.note ? esc(f.note) + '<br>' : ''}</div>`).join('');
    const link = c.linkTitle ? `<p>${c.kind === 'game' ? lnk(P.game(c.linkTitle), `Play ${c.linkTitle} now!`) : lnk(P.watch(c.linkTitle), P.watch(c.linkTitle), { t: c.linkTitle })}</p>` : '';
    return `<div class="pg mail"><div class="mm-wrap">
  <div class="rv mm-head"><span class="mm-logo">${lnk(MAILBOX, '', { html: 'Mail<b>Mole</b>' })}</span><span class="mm-me">${esc(ME)}</span></div>
  <div class="rv mm-tools">${lnk(MAILBOX, '', { html: '&laquo; Back to Inbox' })} <button class="btn-ui" data-act="reply">Reply</button> <button class="btn-ui" data-act="fwd">Forward</button> <button class="btn-ui" data-act="delmsg">Delete</button></div>
  <div class="rv mm-msg"><h1>${esc(c.subject)}</h1>
    <div class="mm-mh"><b>From:</b> ${esc(c.from)} &lt;${esc(c.fromAddr)}&gt;<br><b>To:</b> ${esc(ME)}${c.kind === 'chain' || c.kind === 'joke' ? ', and 47 others' : ''}<br><b>Date:</b> ${esc(c.date)}</div>
    <div class="mm-body${c.kind === 'chain' || c.kind === 'mom' ? ' caps' : ''}">${fwdBlocks}${paras(c.body)}${link}</div>
  </div>
</div></div>`;
  },
  mount(el, c, ctx, api) {
    const id = ctx.url.split('/').pop();
    kv.set('mailRead', [...new Set(kv.get('mailRead', []).concat(id))].slice(-200));
    el.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const act = b.dataset.act;
      if (act === 'reply') compose(el, api);
      else if (act === 'fwd') {
        if (c.kind === 'chain') { await api.alert(`Forwarded to 10 friends. Your ${ctx.r.pick(LEX.thing.map((t) => t + 's'))} are safe... for now.`, 'MailMole'); }
        else api.toast('Forwarded! Your friends will love it (probably).');
      } else if (act === 'delmsg') {
        kv.set('mailDeleted', [...new Set(kv.get('mailDeleted', []).concat(id))]);
        api.toast(c.kind === 'chain' ? 'Deleted. You broke the chain. Something mildly inconvenient will happen.' : 'Moved to Trash.');
        api.go(MAILBOX);
      }
    });
  },
};

