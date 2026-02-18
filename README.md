# scratchly

Simply write notes and export as `.md`.

## Features

- **Multiple ways to open** — toolbar icon click, keyboard shortcut, or side panel
- **Auto-save** — content saves to local storage on every keystroke (debounced)
- **Export** — download your notes as a `.md` file (Ctrl/Cmd+E)
- **Side panel** — use as a persistent sidebar alongside any page
- **Zero dependencies** — plain HTML/CSS/JS, loads instantly

## Install

1. Clone or download this repo
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right)
4. Click **Load unpacked** and select the `scratch-pad` folder

### Opening scratchly

- **Click the extension icon** in the toolbar to open as a full tab
- **Ctrl+Shift+.** (Cmd+Shift+. on Mac) to open as a full tab
- **Side panel**: click Chrome's side panel icon (in the toolbar) and select "scratchly" to use it as a sidebar

## Keyboard Shortcuts

| Shortcut              | Action               |
|-----------------------|----------------------|
| Ctrl/Cmd + Shift + .  | Open scratchly       |
| Ctrl/Cmd + E          | Export as `.md`      |
| Tab                   | Insert tab character |

## Web App

scratchly also runs as a standalone web app at your own domain.

### Deploy to Vercel

```bash
npx vercel
```

To connect a custom domain, run `npx vercel domains add yourdomain.com` or configure it in the [Vercel dashboard](https://vercel.com/dashboard).

### How storage works

- **Chrome extension** — content is stored in `chrome.storage.local` and persists across tabs, windows, and browser restarts
- **Web app** — content is stored in `localStorage` and persists in that browser. A service worker caches assets for offline use, and the app is installable as a PWA
