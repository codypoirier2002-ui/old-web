// Build addresses for links between pages. Hosts always carry a word that
// makes core/site.js classify them as the intended kind of site.
import { HOSTS } from './url.js';
import { LEX } from './lex.js';
import { squash, slug, titleCase, plural } from './util.js';
import { username, clanName, bandName } from './names.js';

const tld = (r) => r.pick(LEX.tld);

export function fanTopic(r) {
  return r.pick([
    () => plural(r.pick(LEX.animal)),
    () => r.pick(LEX.invShow),
    () => r.pick(LEX.invBand),
    () => r.pick(LEX.food),
    () => plural(r.pick(LEX.thing)),
    () => `${r.pick(['rainbow', 'baby', 'fluffy', 'tiny', 'sparkly'])} ${plural(r.pick(LEX.animal))}`,
  ])();
}
export function forumTopic(r) {
  return r.pick([
    () => plural(r.pick(LEX.animal)),
    () => plural(r.pick(LEX.thing)),
    () => r.pick(LEX.food),
    () => r.pick(LEX.invGame),
    () => r.pick(['skateboarding', 'cooking', 'gardening', 'model trains', 'aquariums', 'camping', 'fishing', 'bowling', 'knitting', 'fantasy books', 'magic tricks', 'kites', 'puzzles', 'board games', 'bird watching', 'sneakers', 'vintage toasters', 'lawn care', 'video games', 'retro computers']),
  ])();
}

export function site(kind, r, topic) {
  const t = topic || (kind === 'forum' ? forumTopic(r) : fanTopic(r));
  const sq = squash(t).slice(0, 24);
  switch (kind) {
    case 'fan': {
      if (r.chance(0.35)) {
        const user = `${sq.slice(0, 14)}${r.pick(['fan', 'lover', '4ever', 'girl', 'luv', 'club'])}${r.int(1, 99)}`;
        return { url: `http://${HOSTS.freehost}/~${user}/`, name: `${titleCase(t)} Fan Page`, topic: t, kind, site: `~*~ ${titleCase(t)} ~*~` };
      }
      const aff = r.pick([['4ever', '4 Ever'], ['fans', 'Fans'], ['fanzone', 'Fan Zone'], ['fanclub', 'Fan Club'], ['shrine', 'Shrine'], ['lovers', 'Lovers'], ['starz', 'Starz'], ['4evr', '4 Evr']]);
      const name = `${titleCase(t)} ${aff[1]}`;
      return { url: `http://www.${sq}${aff[0]}.${tld(r)}/`, name, topic: t, kind, site: name };
    }
    case 'forum': {
      const aff = r.pick([['talk', 'Talk'], ['forums', 'Forums'], ['board', 'Board'], ['community', 'Community'], ['bbs', 'BBS'], ['debate', 'Debate Club']]);
      const name = `${titleCase(t)} ${aff[1]}`;
      return { url: `http://www.${sq}${aff[0]}.${tld(r)}/`, name, topic: t, kind, site: name };
    }
    case 'blog': {
      const who = slug(username(r)).replace(/-/g, '').slice(0, 18) || 'blogger';
      const name = r.pick([`${titleCase(who)}'s Blog`, `Thoughts of a ${titleCase(r.pick(LEX.sillyNoun))}`, `Life with ${titleCase(plural(r.pick(LEX.animal)))}`, `The ${titleCase(r.pick(LEX.adj))} Diaries`, `${titleCase(t)} & Other Musings`, `Random Ramblings`]);
      return { url: `http://${who}.${HOSTS.blogs}/`, name, topic: t, kind, site: name };
    }
    case 'clan': {
      const cn = topic && /\s/.test(topic) ? topic : clanName(r);
      const s2 = squash(cn);
      const url = r.chance(0.5) ? `http://www.clan${s2}.${tld(r)}/` : `http://www.${s2}clan.${tld(r)}/`;
      return { url, name: cn, topic: cn, kind, site: cn };
    }
    case 'trickshot': {
      const who = topic || clanName(r);
      const s2 = squash(who);
      const url = `http://www.${s2}${r.pick(['trickshots', 'montages'])}.${tld(r)}/`;
      return { url, name: `${who} Trickshots`, topic: who, kind, site: `${who} Trickshots` };
    }
    case 'howto': {
      if (r.chance(0.3)) {
        const name = `${titleCase(t)} Tips`;
        return { url: `http://www.${sq}${r.pick(['tips', 'guide', 'help', 'diy'])}.${tld(r)}/`, name, topic: t, kind, site: name };
      }
      return { url: `http://${HOSTS.howto}/`, name: 'HowToTown', topic: t, kind };
    }
    case 'personal': {
      const user = `${r.pick(LEX.firstName).toLowerCase()}${r.pick(['', '_', ''])}${r.pick(LEX.lastName).toLowerCase()}`;
      return { url: `http://${HOSTS.freehost}/~${user}/`, name: `${titleCase(user.replace(/_/g, ' '))}'s Homepage`, topic: t, kind };
    }
    case 'video': return { url: `http://${HOSTS.video}/`, name: 'Vidoodle', topic: t, kind };
    case 'games': return { url: `http://${HOSTS.games}/`, name: 'Arcadeville', topic: t, kind };
    case 'chat': return { url: `http://${HOSTS.chat}/`, name: 'Chatterbox', topic: t, kind };
    case 'mail': return { url: `http://${HOSTS.mail}/`, name: 'MailMole', topic: t, kind };
    case 'search': return { url: `http://${HOSTS.search}/`, name: 'Searchasaurus', topic: t, kind };
    case 'news': return { url: `http://${HOSTS.news}/`, name: 'StartBlaster News', topic: t, kind };
    default: return { url: `http://${HOSTS.portal}/`, name: 'StartBlaster!', topic: t, kind: 'portal' };
  }
}

// Specific pages on the big sites.
export const page = {
  watch: (title) => `http://${HOSTS.video}/watch/${slug(title)}`,
  channel: (user) => `http://${HOSTS.video}/user/${slug(user)}`,
  game: (name) => `http://${HOSTS.games}/play/${slug(name)}`,
  room: (name) => `http://${HOSTS.chat}/room/${slug(name)}`,
  guide: (title) => `http://${HOSTS.howto}/${slug(title)}`,
  story: (title) => `http://${HOSTS.news}/story/${slug(title)}`,
  email: (id) => `http://${HOSTS.mail}/read/${slug(String(id))}`,
  thread: (siteRoot, title) => `${siteRoot.replace(/\/$/, '')}/thread/${slug(title)}`,
  board: (siteRoot, name) => `${siteRoot.replace(/\/$/, '')}/forum/${slug(name)}`,
  post: (siteRoot, title, month = 11) => `${siteRoot.replace(/\/$/, '')}/2012/${String(month).padStart(2, '0')}/${slug(title)}.html`,
  sub: (siteRoot, name) => `${siteRoot.replace(/\/$/, '')}/${slug(name)}.html`,
  montage: (siteRoot, title) => `${siteRoot.replace(/\/$/, '')}/${slug(title)}`,
};

export { bandName };
