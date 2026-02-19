# scratchly

A minimal scratchpad that lives in your browser. No sign-up, no cloud — everything stays on your device.

**Web app:** [scratchly.xyz](https://scratchly.xyz) · **Chrome extension:** [Chrome Web Store](https://chromewebstore.google.com/detail/pmjpljdhpohhlhekfkjlddaafhfodbdg)

## Features

- **Slash commands** — type `/` to insert headings, lists, to-dos, quotes, dividers, toggle theme, or import/export files
- **To-do lists** — interactive checkboxes with strikethrough on completion; Enter creates a new item, Ctrl/Cmd+Enter toggles the checkbox
- **Markdown import & export** — open `.md` files (via slash command or drag-and-drop) and save your notes as `.md`
- **Dark & light theme** — toggle via slash command; persists across sessions
- **Auto-save** — content saves on every keystroke (debounced)
- **Paste as plain text** — URLs are automatically converted to clickable links
- **Offline-first** — service worker caches assets for offline use
- **Installable PWA** — add to your home screen from the web app
- **Side panel** — use as a persistent sidebar alongside any Chrome tab
- **Privacy-focused** — zero analytics, zero network requests, all data stays local
- **Zero dependencies** — plain HTML/CSS/JS, loads instantly

## Install (Chrome extension)

1. Install from the [Chrome Web Store](https://chromewebstore.google.com/detail/pmjpljdhpohhlhekfkjlddaafhfodbdg)

Or load unpacked for development:

1. Clone this repo
2. Go to `chrome://extensions/`
3. Enable **Developer mode**
4. Click **Load unpacked** and select the project folder

### Opening scratchly

- **Click the extension icon** to open in the side panel
- **Ctrl+.** (Cmd+. on Mac) to open the side panel via keyboard

## Web App

scratchly also runs as a standalone web app at [scratchly.xyz](https://scratchly.xyz).

### Deploy to Vercel

```bash
npx vercel
```

To connect a custom domain, run `npx vercel domains add yourdomain.com` or configure it in the [Vercel dashboard](https://vercel.com/dashboard).

## Keyboard Shortcuts

| Shortcut             | Action                |
|----------------------|-----------------------|
| /                    | Open slash command menu |
| Ctrl/Cmd + .         | Open scratchly (extension) |
| Ctrl/Cmd + E         | Export as `.md`       |
| Ctrl/Cmd + Enter     | Toggle todo checkbox  |
| Tab                  | Insert tab character  |
| Backspace (at start) | Revert block to plain text |

## Slash Commands

| Command        | Shorthand | Description               |
|----------------|-----------|---------------------------|
| Light/Dark mode |          | Toggle theme              |
| Open .md       |           | Import a markdown file    |
| Save as .md    |           | Export notes as markdown  |
| Text           |           | Plain text block          |
| Heading 1      | #         | Large heading             |
| Heading 2      | ##        | Medium heading            |
| Heading 3      | ###       | Small heading             |
| Bulleted list  | -         | Unordered list            |
| Numbered list  | 1.        | Ordered list              |
| To-do list     | []        | Checkbox list             |
| Quote          |           | Blockquote                |
| Divider        | ---       | Horizontal rule           |

## How Storage Works

- **Chrome extension** — content is stored in `chrome.storage.local` and persists across tabs, windows, and browser restarts
- **Web app** — content is stored in `localStorage` and persists in that browser; a service worker caches assets for offline use, and the app is installable as a PWA

## Project Structure

```
├── index.html          Landing page (scratchly.xyz)
├── app.html            Web app entry point (/app)
├── newtab.html         Extension editor (side panel / new tab)
├── newtab.css          Editor styles (dark & light themes)
├── newtab.js           Editor logic (slash commands, todos, import/export)
├── background.js       Extension service worker
├── manifest.json       Chrome extension manifest (v3)
├── sw.js               Web app service worker (offline caching)
├── site.webmanifest    PWA manifest
├── vercel.json         Vercel routing & headers
├── privacy-policy.html Privacy policy page
└── icons/              App icons (SVG + PNG)
```

## Privacy

scratchly collects no data. Zero analytics, zero telemetry, zero network requests. All content stays on your device. See the full [privacy policy](https://scratchly.xyz/privacy-policy.html).

## License

MIT
