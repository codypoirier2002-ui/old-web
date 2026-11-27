import './styles/browser.css';
import './styles/widgets.css';
import './styles/portal.css';
import './styles/sites.css';
import { Browser } from './browser/browser.js';
import { ai, produce } from './ai/client.js';
import { decorate } from './browser/period.js';
import { sfx, unlock } from './browser/audio.js';
import { openMenu, suggest, closeSuggest, recordVisit } from './browser/panels.js';

const app = document.getElementById('app');
const browser = new Browser(app, {
  produce: (url, hint, cb) => produce(url, hint, cb, browser.settings.ai !== false),
  decorate,
  sound: sfx,
  menu: (b) => openMenu(b),
  suggest: (b, text) => suggest(b, text),
  closeSuggest: () => closeSuggest(browser),
  onVisit: (page) => recordVisit(page),
});
// Phones only allow sound after a tap, so wake the audio on the first one.
['pointerdown', 'keydown'].forEach((ev) => window.addEventListener(ev, unlock, { once: true, capture: true }));
ai.probe().finally(() => browser.start());

// handy for poking around in the console
window.netskipper = browser;
window.oldWebAi = ai;
