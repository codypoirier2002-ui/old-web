// Comment sections: the generated ones plus anything you post yourself
// (saved with the page). Someone usually replies.
import { esc, lnk } from './html.js';
import { avatar } from './widgets.js';
import { fmt } from '../core/util.js';
import { username } from '../core/names.js';
import { Rng } from '../core/rng.js';
import { kv } from '../browser/storage.js';
import { C_FIRST_REPLY } from '../pages/common.js';

function one(c, o, mine = false) {
  const who = o.userUrl ? lnk(o.userUrl(c.user), c.user, { cls: 'cm-u' }) : `<b class="cm-u">${esc(c.user)}</b>`;
  const replies = (c.replies || []).map((rp) => `<div class="cm cm-r">${avatar(rp.user, 28)}<div class="cm-b"><div class="cm-h">${o.userUrl ? lnk(o.userUrl(rp.user), rp.user, { cls: 'cm-u' }) : `<b class="cm-u">${esc(rp.user)}</b>`} <small>${esc(rp.ago || '')}</small></div><div class="cm-t">${esc(rp.text)}</div></div></div>`).join('');
  return `<div class="cm${mine ? ' cm-mine' : ''}">${avatar(c.user, 36)}<div class="cm-b"><div class="cm-h">${who} <small>${esc(c.ago || 'just now')}</small></div><div class="cm-t">${esc(c.text)}</div>${c.likes != null ? `<div class="cm-f"><span class="cm-like" data-act="like">&#9650; ${fmt(c.likes)}</span> <span class="cm-like" data-act="dislike">&#9660;</span> <span class="cm-reply">Reply</span></div>` : ''}${replies}</div></div>`;
}

export function commentsBlock(list, ctx, o = {}) {
  const mine = ((ctx.state && ctx.state.mine) || []).slice().reverse();
  const total = (o.total != null ? o.total : list.length) + mine.length;
  return `<section class="rv cmts" data-flavor="${o.flavor || 'generic'}">
  <h3 class="cm-title">${esc(o.title || 'Comments')} <small>(${fmt(total)})</small></h3>
  <form class="cm-form" data-cmform>
    <input name="who" maxlength="30" placeholder="Your name" autocomplete="off">
    <textarea name="text" rows="2" maxlength="400" placeholder="${esc(o.placeholder || 'Add a comment...')}"></textarea>
    <button class="gl sm" type="submit">${esc(o.button || 'Post Comment')}</button>
  </form>
  <div class="cm-list">${mine.map((c) => one(c, o, true)).join('')}${(list || []).map((c) => one(c, o)).join('')}</div>
</section>`;
}

const BOT = {
  generic: ['lol same', 'this is the best comment', 'agreed!!', '+1', 'welcome to the internet friend', 'haha totally', 'i was just about to say that', 'wise words', 'can confirm', 'this comment needs more likes'],
  blog: ['Thanks for stopping by!! :)', 'aww thank you!', 'lol you get it', 'Thanks for reading! Come back soon!'],
  question: ['good question!', 'i was wondering the same thing', 'idk lol', 'try turning it off and on again', 'my cousin knows, ill ask him'],
};

export function mountComments(root, ctx, api, o = {}) {
  const form = root.querySelector('[data-cmform]');
  if (!form) return () => {};
  const timers = [];
  const nick = kv.get('nick', '');
  if (nick) form.who.value = nick;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = form.text.value.trim();
    if (!text) { api.alert('Please type a comment first!'); return; }
    const who = (form.who.value.trim() || 'Guest').slice(0, 30);
    kv.set('nick', who);
    const state = api.state();
    const mine = (state.mine || []).concat({ user: who, text: text.slice(0, 400), ago: 'just now' }).slice(-30);
    api.save({ mine });
    form.text.value = '';
    api.sound('click');
    const listEl = root.querySelector('.cm-list');
    listEl.insertAdjacentHTML('afterbegin', one({ user: who, text, ago: 'just now' }, o, true));
    const first = listEl.firstElementChild;
    // someone always has something to say
    const r = new Rng(text + Date.now());
    const flavor = root.querySelector('.cmts')?.dataset.flavor || 'generic';
    let pool = BOT.generic;
    if (/f(i|ri)rst/i.test(text)) pool = C_FIRST_REPLY.map((s) => s.replace('{who}', who));
    else if (/\?\s*$/.test(text)) pool = BOT.question;
    else if (flavor === 'blog') pool = BOT.blog;
    timers.push(setTimeout(() => {
      if (!first.isConnected) return;
      const user = flavor === 'blog' && pool === BOT.blog ? (o.author || 'the author') : username(r);
      first.querySelector('.cm-b').insertAdjacentHTML('beforeend', `<div class="cm cm-r">${avatar(user, 28)}<div class="cm-b"><div class="cm-h"><b class="cm-u">${esc(user)}</b> <small>just now</small></div><div class="cm-t">${esc(r.pick(pool))}</div></div></div>`);
      api.sound('pop');
    }, 2500 + r.int(0, 3500)));
  });
  root.addEventListener('click', (e) => {
    const b = e.target.closest('.cm-like');
    if (!b || b.dataset.done) return;
    b.dataset.done = '1';
    b.classList.add('on');
    if (b.dataset.act === 'like') b.innerHTML = b.innerHTML.replace(/[\d,]+/, (n) => fmt(parseInt(n.replace(/,/g, ''), 10) + 1));
    api.sound('click');
  });
  return () => timers.forEach(clearTimeout);
}
