// Every page type: gen(ctx) -> content, title(content), render(content) -> HTML,
// optional mount(el, content, ctx, api) for interactive bits.
import * as portal from './portal.js';
import { personal, personalSub, notFound, noServer, about, portalInfo } from './misc.js';

export const TYPES = {
  portal,
  portalInfo,
  personal,
  personalSub,
  notFound,
  noServer,
  about,
};
