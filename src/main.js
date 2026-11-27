import './styles/browser.css';
import './styles/widgets.css';
import './styles/portal.css';
import './styles/sites.css';
import { Browser } from './browser/browser.js';
import { ai, produce } from './ai/client.js';

const app = document.getElementById('app');
const browser = new Browser(app, {
  produce: (url, hint, cb) => produce(url, hint, cb, browser.settings.ai !== false),
});
ai.probe().finally(() => browser.start());

// handy for poking around in the console
window.netskipper = browser;
window.oldWebAi = ai;
