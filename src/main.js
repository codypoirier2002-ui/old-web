import './styles/browser.css';
import './styles/widgets.css';
import './styles/portal.css';
import { Browser } from './browser/browser.js';

const app = document.getElementById('app');
const browser = new Browser(app, {});
browser.start();

// handy for poking around in the console
window.netskipper = browser;
