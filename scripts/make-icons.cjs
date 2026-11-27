// Renders the app icons (public/*.png) from an SVG using the headless
// browser. Run once: node scripts/make-icons.cjs
const path = require('path');
const { chromium } = require('playwright');

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d73bd"/><stop offset="1" stop-color="#0f2a4e"/></linearGradient>
<radialGradient id="g" cx=".36" cy=".3" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset=".22" stop-color="#9fe0ff"/><stop offset=".6" stop-color="#2a8de0"/><stop offset="1" stop-color="#0a3d7d"/></radialGradient>
</defs>
<rect width="512" height="512" rx="96" fill="url(#bg)"/>
<circle cx="256" cy="262" r="150" fill="url(#g)"/>
<path d="M150 230c40 10 60-30 100-14s30 50 70 40 40-40 60-30" stroke="#2fb86b" stroke-width="22" fill="none" stroke-linecap="round" opacity=".85"/>
<path d="M170 320c30-10 50 20 90 6" stroke="#2fb86b" stroke-width="18" fill="none" stroke-linecap="round" opacity=".85"/>
<ellipse cx="256" cy="262" rx="215" ry="70" fill="none" stroke="#ffe26a" stroke-width="16" transform="rotate(-24 256 262)"/>
<circle cx="440" cy="168" r="26" fill="#ffe26a"/>
<circle cx="440" cy="168" r="44" fill="#ffe26a" opacity=".25"/>
</svg>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const out = path.join(__dirname, '..', 'public');
  for (const [name, size] of [['icon-512.png', 512], ['icon-192.png', 192], ['apple-touch-icon.png', 180], ['favicon-32.png', 32]]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<html><body style="margin:0;background:transparent">${SVG.replace('viewBox', `width="${size}" height="${size}" viewBox`)}</body></html>`);
    await page.screenshot({ path: path.join(out, name), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  }
  require('fs').writeFileSync(path.join(out, 'icon.svg'), SVG);
  await browser.close();
  console.log('icons written to public/');
})();
