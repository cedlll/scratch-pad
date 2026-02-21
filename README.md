# scratchly

A minimal scratchpad that lives in your browser. No sign-up, no cloud — everything stays on your device.

**Web app:** [scratchly.xyz](https://scratchly.xyz) · **Chrome extension:** [Chrome Web Store](https://chromewebstore.google.com/detail/pmjpljdhpohhlhekfkjlddaafhfodbdg)

## What's New in v1.2.0

🔒 **Security Enhancements:**
- Added DOMPurify for XSS protection on all HTML content
- Fixed XSS vulnerabilities in content restoration and markdown imports
- Improved service worker error handling

✨ **Enhanced Markdown Support:**
- **Bold** text: `**text**` or `__text__`
- *Italic* text: `*text*` or `_text_`
- `Inline code`: `` `code` ``
- [Links](url): `[text](url)`
- Code blocks with syntax highlighting: ` ```language `

🐛 **Bug Fixes:**
- Fixed slash command triggering on URLs (e.g., `http://`)
- Fixed service worker offline caching (added missing assets)
- Removed unnecessary setTimeout in checkbox handling
- Improved error handling throughout the app

📦 **Project Infrastructure:**
- Added package.json with proper dependencies
- Added MIT LICENSE
- Improved .gitignore
- Updated privacy policy with theme preference disclosure

## Features

- **Slash commands** — type `/` to insert headings, lists, to-dos, quotes, dividers, toggle theme, or import/export files
- **Enhanced markdown** — import/export with support for **bold**, *italic*, `code`, [links](url), and code blocks
- **To-do lists** — interactive checkboxes with strikethrough on completion; Enter creates a new item, Ctrl/Cmd+Enter toggles the checkbox
- **Dark & light theme** — toggle via slash command; persists across sessions
- **Auto-save** — content saves on every keystroke (debounced)
- **Paste as plain text** — URLs are automatically converted to clickable links
- **Offline-first** — service worker caches assets for offline use
- **Installable PWA** — add to your home screen from the web app
- **Security-hardened** — DOMPurify sanitization prevents XSS attacks
- **Privacy-focused** — zero analytics, zero network requests, all data stays local
- **Lightweight** — minimal dependencies (only DOMPurify), loads instantly

## Install (Chrome extension)

1. Install from the [Chrome Web Store](https://chromewebstore.google.com/detail/pmjpljdhpohhlhekfkjlddaafhfodbdg)

Or load unpacked for development:

1. Clone this repo
2. Go to `chrome://extensions/`
3. Enable **Developer mode**
4. Click **Load unpacked** and select the project folder

### Opening scratchly

- **Click the extension icon** to open in a new tab
- **Ctrl+.** (Cmd+. on Mac) to open in a new tab via keyboard

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
├── newtab.html         Extension editor (new tab)
├── newtab.css          Editor styles (dark & light themes)
├── newtab.js           Editor logic (slash commands, todos, import/export)
├── background.js       Extension service worker
├── manifest.json       Chrome extension manifest (v3)
├── sw.js               Web app service worker (offline caching)
├── site.webmanifest    PWA manifest
├── vercel.json         Vercel routing & headers
├── privacy-policy.html Privacy policy page
├── package.json        Dependencies and scripts
├── LICENSE             MIT license
├── src/                ES6 modules
│   ├── core/          Core utilities (sanitization, storage)
│   ├── config/        Constants and configuration
│   └── utils/         Utility functions (markdown parser)
├── vendor/             Third-party dependencies (DOMPurify)
└── icons/              App icons (SVG + PNG)
```

## Privacy

scratchly collects no data. Zero analytics, zero telemetry, zero network requests. All content stays on your device. See the full [privacy policy](https://scratchly.xyz/privacy-policy.html).

## License

MIT
