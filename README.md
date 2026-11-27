# The Old Web

An endless fake internet from around 2012, as a phone-first browser game.

You get an old-school browser called NetSkipper and a homepage portal. Every link opens a brand-new page, and you can type any address or search for anything. Pages are saved, so going back works and a site looks the same when you return. Everything out there is made up: no real people, brands, sites, games or songs.

There are a few things hidden around. Go find them.

## Play it on your phone

Once GitHub Pages is switched on (one time, below), the game lives at:

**https://codypoirier2002-ui.github.io/old-web/**

On an iPhone, open it in Safari, tap Share, then "Add to Home Screen" for a full-screen app icon. The online version always uses the built-in page generator. The AI writer only runs on your own computer, because that is where your API key lives.

### Turning on GitHub Pages (one time)

1. On GitHub, open the repository's **Settings**, then **Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Merge this branch into `main`. Every push to `main` then rebuilds and publishes the site. The **Actions** tab shows progress, and you can also run "Deploy to GitHub Pages" by hand from there.

## Run it on your computer

You need Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:5173. To play on your phone over the same Wi-Fi, open the "Network" address that `npm run dev` prints (something like `http://192.168.1.20:5173`).

`npm start` builds the game and serves the production version at the same address.

## The AI writer (optional)

With an Anthropic API key, Claude (the `claude-haiku-5-5` model) writes each new page instead of the built-in generator. The game asks for a page only when you open one it has not seen before. Every page is cached, and there is a daily limit.

**Where to put your key:**

1. In the project folder (next to `package.json`), copy `.env.example` to a new file named **`.env.local`**.
2. Paste your key after the `=` sign so the line reads `ANTHROPIC_API_KEY=` followed by your key.
3. Restart `npm run dev` (or `npm start`).

The terminal then says `AI writer ON`. Without a key it says `AI writer OFF` and the built-in generator makes every page, so the game works either way.

How the key stays safe:

- `.env.local` is listed in `.gitignore`, so it is never committed.
- The key is read only by the small local server inside `npm run dev` / `npm start`. The browser talks to that server at `/api/page` and never sees the key.
- The key is never printed. The server logs only which page it wrote and how many pages it has written today.

Limits and cost:

- `OLDWEB_DAILY_CAP` in `.env.local` sets how many new pages Claude may write per day (default 150). After that, the built-in generator takes over until tomorrow. The count is kept in `.oldweb-usage.json`.
- Written pages are cached in your browser and in `.oldweb-cache.json`, so going back, reloading or revisiting never costs anything.
- At Anthropic's published Claude Haiku 5.5 prices ($0.10 per million input tokens, $0.50 per million output tokens), one page costs roughly a tenth to a fifth of a cent. A full day at the default cap comes to about 30 cents at most.
- You can switch the AI writer off at any time from the browser's menu (the button with three lines).

## Settings

The menu button in the toolbar has history, bookmarks, connection speed (how slowly pages load), sound, a pop-up blocker, the startup screen (full, quick or off), the AI writer switch, and "Clear all saved data". Bookmarks, history, visited pages, high scores and everything else are saved in your browser automatically.

## Tests

```bash
npm test
```

This crawls about 4,000 generated pages looking for crashes or broken text, then checks the AI writer: that each page type's schema matches the built-in pages, that hostile text cannot inject markup or links, and that the server's caching, daily cap and request checks work. It does this against a local mock, so it never calls the real API or spends anything.

## How it's built

- **Vite**, plain JavaScript, no framework. Pages are drawn with CSS and inline SVG (no image files), and everything animates with transform and opacity only, so it stays smooth on older iPhones and integrated graphics.
- `src/browser/`: the NetSkipper browser (navigation, loading bar, menus, boot screen, sound).
- `src/pages/`: one module per kind of site. Each one generates content from a seed made from the page address (so the same address always gives the same page) and renders it.
- `src/ai/` and `server/`: the AI writer. Claude returns structured JSON for the page type, which is checked and merged over the built-in page, so it can only fill in text, never add links or markup.
- `scripts/`: tests and the icon generator.
