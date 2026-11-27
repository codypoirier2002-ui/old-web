// What the AI writer returns for each page type. These mirror the built-in
// generator's content (src/pages/*.js); the game merges them over the
// built-in page, so any field left out keeps its built-in value.
import { z } from 'zod';

const S = () => z.string();
const strs = () => z.array(S());
const comment = z.object({ user: S(), text: S(), replies: z.array(z.object({ user: S(), text: S() })) });
const comments = z.array(comment);
const song = z.object({ title: S(), artist: S() });

export const SCHEMAS = {
  forumIndex: z.object({
    tagline: S(),
    announcement: S(),
    categories: z.array(z.object({ name: S(), boards: z.array(z.object({ name: S(), desc: S(), lastTitle: S(), lastUser: S() })) })),
    hot: z.array(z.object({ title: S(), user: S() })),
    online: z.object({ names: strs() }),
    stats: z.object({ newest: S() }),
  }),
  board: z.object({ threads: z.array(z.object({ title: S(), user: S() })) }),
  thread: z.object({
    posts: z.array(z.object({ user: S(), rank: z.enum(['Newbie', 'Member', 'Senior Member', 'Forum Legend', 'Old Timer', 'Moderator']), text: S(), sig: S(), quoteUser: S(), quoteText: S() })),
    locked: S(),
  }),
  videoHome: z.object({ featured: z.object({ title: S(), user: S() }), vids: z.array(z.object({ title: S(), user: S() })), trending: strs() }),
  watch: z.object({ user: S(), desc: S(), comments, related: z.array(z.object({ title: S(), user: S() })) }),
  channel: z.object({ about: S(), vids: z.array(z.object({ title: S() })) }),
  fan: z.object({ heading: S(), intro: S(), owner: S(), news: z.array(z.object({ text: S() })), about: S(), reasons: strs(), pics: strs(), awards: strs(), song }),
  guestbook: z.object({ entries: z.array(z.object({ name: S(), from: S(), msg: S() })) }),
  links: z.object({ ring: S(), friends: z.array(z.object({ name: S(), topic: S(), blurb: S() })) }),
  fanSub: z.object({ heading: S(), text: S(), facts: strs(), pics: strs(), quiz: z.object({ q: S(), opts: strs() }) }),
  clan: z.object({ game: S(), leader: S(), motto: S(), about: S(), reqs: strs(), rules: strs(), roster: z.array(z.object({ name: S(), rank: S() })), wars: z.array(z.object({ vs: S() })), sponsors: strs(), shouts: z.array(z.object({ user: S(), msg: S() })), song }),
  trickshot: z.object({ desc: S(), editor: S(), shots: z.array(z.object({ player: S(), shot: S() })), song, shoutouts: strs(), comments, others: strs() }),
  howtoHome: z.object({ featured: S(), popular: z.array(z.object({ title: S() })), tip: S() }),
  guide: z.object({ intro: S(), needs: strs(), steps: strs(), tips: strs(), warnings: strs(), author: S(), related: strs(), comments }),
  blogHome: z.object({ posts: z.array(z.object({ title: S(), body: S(), mood: S(), music: S() })) }),
  blogPost: z.object({ post: z.object({ body: S(), mood: S(), music: S() }), comments }),
  newsHome: z.object({ top: S(), sections: z.array(z.object({ name: S(), items: strs() })) }),
  article: z.object({ byline: S(), body: S(), related: strs(), comments }),
  results: z.object({
    didYouMean: S(),
    ads: z.array(z.object({ product: S(), line: S() })),
    results: z.array(z.object({ title: S(), snippet: S(), kind: z.enum(['fan', 'forum', 'blog', 'video', 'howto', 'news', 'game', 'clan', 'chat', 'personal', 'trickshot']), topic: S() })),
    related: strs(),
  }),
  inbox: z.object({ emails: z.array(z.object({ from: S(), subject: S() })) }),
  email: z.object({ from: S(), body: S(), fwd: z.array(z.object({ from: S(), note: S() })) }),
  chatRoom: z.object({ topic: S(), users: strs(), script: z.array(z.object({ type: z.enum(['msg', 'join', 'leave', 'action']), user: S(), text: S() })) }),
  gamesHome: z.object({ games: z.array(z.object({ name: S(), desc: S() })) }),
  game: z.object({ desc: S(), more: strs(), comments }),
  product: z.object({ tagline: S(), pitch: S(), features: strs(), testimonials: z.array(z.object({ name: S(), from: S(), quote: S() })), bonus: S() }),
  personal: z.object({ heading: S(), about: S(), facts: strs(), links: z.array(z.object({ name: S(), topic: S(), kind: z.enum(['fan', 'blog', 'forum', 'personal', 'clan']) })) }),
};

// What to write, per page type. {title}, {topic}, {site}, {q} are filled in.
export const GUIDE = {
  forumIndex: 'The front page of a message board called "{site}", about {topic}. 2 categories with 3 boards each (board names, one-line descriptions, the title and author of the latest thread), 5 hot thread titles with silly friendly debates, 5 online usernames, a newest member, a tagline and a short announcement from the admins.',
  board: 'A list of 15 thread titles (and their authors) inside the board "{title}" on the {topic} forum "{site}". Mix silly debates ("X > Y. Fight me."), questions, polls, introductions and off-topic fun.',
  thread: 'A forum thread titled "{title}" on "{site}", a forum about {topic}. Write 8 to 12 posts: the thread starter first, then replies arguing silly sides, someone going off-topic, someone posting "/thread" or "pics or it didn\'t happen", one friendly moderator note (rank Moderator), maybe the starter declaring victory. Use quoteUser/quoteText to quote an earlier post now and then (empty strings otherwise). sig is a short forum signature or empty. locked is empty, or a funny moderator note if the thread got locked.',
  videoHome: 'The front page of the video site Vidoodle{qpart}: a featured video and 12 video titles with uploader usernames, plus 5 trending video titles. Titles like 2012 uploads: pets, fails, tutorials, gameplay, music videos by invented bands, vlogs.',
  watch: 'A video page for the video "{title}". The uploader username, a short description (thanks for watching, like and subscribe...), 10 comments with a "first!" comment war at the top (replies arguing about who was first), normal funny comments after, and 8 related video titles with uploaders.',
  channel: 'A channel page for the video uploader "{title}". A short about blurb and 9 of their video titles.',
  fan: 'A glittery fan page all about {topic}, made by a fan in 2012. A heading full of ~*~ decorations, an excited intro, the webmaster username, 3 site updates, an about paragraph, exactly 10 reasons why {topic} rocks, 4 picture captions, 3 made-up awards the site won, and an invented song playing on the page.',
  guestbook: 'The guestbook of a fan page about {topic}. 8 entries from visitors: name, where they are from (invented towns), short excited messages.',
  links: 'The links page of a fan page about {topic}: the name of a webring, and 8 friends\' fan sites (site name, what each is about, a short blurb).',
  fanSub: 'A sub-page called "{title}" on a fan page about {topic}. A heading, a short paragraph, 6 fun facts, 6 picture captions and a one-question fan quiz with 4 answers.',
  clan: 'The recruitment page of a gaming clan called "{site}". The invented video game they play, the leader username, a motto, an about paragraph, 6 silly requirements to join, 5 clan rules, a roster of 8 members (gamertags and ranks), 5 rival clans they fought, 2 invented sponsors, 6 shoutbox messages and an invented song.',
  trickshot: 'A trickshot montage page by "{site}": "{title}". A hype description, the editor username, 8 trickshots (player gamertag + invented trick name), the song used (invented artist and title), 4 shoutouts, 10 comments ("song name??", "that shot at 1:24!!") and 4 titles of their other montages.',
  howtoHome: 'The front page of a how-to site about {topic}: a featured guide title, 10 popular "How to..." guide titles, and a tip of the day.',
  guide: 'A how-to guide titled "{title}". A short intro, 4 things you need, 5 to 8 step-by-step instructions (silly but followable), 2 tips, 2 warnings, the author username, 5 related guide titles, and 6 reader comments.',
  blogHome: 'The front page of a personal blog called "{site}", written by a kid or teen in 2012 who likes {topic}. 3 recent posts: title, body (2 to 4 short paragraphs about everyday silly life), mood and what they were listening to (invented band - invented song).',
  blogPost: 'A blog post titled "{title}" on the personal blog "{site}". The body (3 to 5 short paragraphs), mood, what they were listening to (invented), and 6 reader comments.',
  newsHome: 'The front page of StartBlaster News: a top headline and 4 sections (U.S. & World, Science, Entertainment, Odd News) with 3 or 4 silly, harmless headlines each.',
  article: 'A silly, harmless news article with the headline "{title}". A byline (invented reporter), the article body (4 to 6 short paragraphs with quotes from invented witnesses and experts), 4 related headlines and 6 reader comments.',
  results: 'Search engine results for the query "{q}". 10 results: a page title, a 1 to 2 sentence snippet, what kind of site it is, and the topic it is about (usually the query). Mix kinds (fan, forum, blog, video, howto, news, game, clan, chat, personal, trickshot). Also 1 or 2 sponsored ads for invented products, an optional "did you mean" suggestion (or empty), and 6 related searches.',
  inbox: 'A 2012 webmail inbox. 15 emails: sender name and subject. Chain letters ("FW: FW: send this to 10 people!!!"), forwarded jokes, an obviously silly "you won a prize" email, a prince from an invented kingdom, newsletters from invented products, forum notifications, friends, mom, a party invitation.',
  email: 'The email "{title}" from {from}. The sender name, the body (as the sender would write it; chain letters in a breathless style, mom in a sweet confused style), and for forwards 2 to 4 earlier forwarders with short notes (empty list if not a forward).',
  chatRoom: 'A chat room called "{title}" on Chatterbox. A room topic line, 8 usernames, and a script of 50 chat lines in order (mostly msg, a few join, leave and action lines; action text is what they do, like "does a little dance"; leave text is a quit reason; join text is empty). Friendly, silly, lots of "lol", brb, random questions. No personal information.',
  gamesHome: 'The front page of the free games site Arcadeville: 12 invented mini-game names with a one-line description each. Names should hint at simple games: catching things, whacking things, a hungry snake, memory match, dodging, a flying cave game, an idle clicker, brick bashing.',
  game: 'The page for the free online game "{title}". A short hype description, 6 names of other games on the site, and 7 player comments bragging about high scores.',
  product: 'An over-the-top infomercial landing page for the invented product "{title}". A tagline, a pitch (2 short paragraphs), 5 silly features, 3 glowing customer testimonials (invented names and towns) and a "But wait, there\'s more!" bonus offer. Obviously silly, never a real scam.',
  personal: 'A personal homepage on a free host, made by a regular person in 2012 ({site}). A heading, an about-me paragraph, 4 fun facts and 4 favorite links (site name, topic, kind).',
};
