// Every page type: gen(ctx) -> content, title(content), render(content) -> HTML,
// optional mount(el, content, ctx, api) for interactive bits.
import * as portal from './portal.js';
import { personal, personalSub, notFound, noServer, about, portalInfo } from './misc.js';
import { forumIndex, board, thread } from './forum.js';
import { videoHome, watch, channel } from './video.js';
import { fan, guestbook, links, fanSub } from './fan.js';
import { clan, trickshot } from './clan.js';
import { howtoHome, guide } from './howto.js';
import { blogHome, blogPost, newsHome, article } from './blog.js';
import { searchHome, results } from './search.js';
import { inbox, email } from './mail.js';
import { chatLobby, chatRoom } from './chat.js';
import { gamesHome, game } from './games.js';

export const TYPES = {
  portal, portalInfo, personal, personalSub, notFound, noServer, about,
  forumIndex, board, thread,
  videoHome, watch, channel,
  fan, guestbook, links, fanSub,
  clan, trickshot,
  howtoHome, guide,
  blogHome, blogPost, newsHome, article,
  searchHome, results,
  inbox, email,
  chatLobby, chatRoom,
  gamesHome, game,
};
