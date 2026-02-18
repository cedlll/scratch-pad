# Migration Plan: `document.execCommand` → Modern APIs

`document.execCommand()` is deprecated. Browsers still support it but have stopped
adding features, and it may eventually be removed. This document tracks the
migration to standards-based alternatives.

## Current Usage

All calls live in `newtab.js`:

| Call | Line(s) | Purpose |
|------|---------|---------|
| `insertText` | Tab key handler | Insert a tab character at caret |
| `insertUnorderedList` | Slash command + backspace handler | Toggle `<ul>` |
| `insertOrderedList` | Slash command + backspace handler | Toggle `<ol>` |
| `formatBlock` | Slash commands (H1/H2/H3, blockquote) | Wrap selection in a block element |
| `insertHTML` | Slash command (divider) | Insert `<hr>` + empty `<div>` |
| `delete` | `deleteSlashText()` | Delete the `/` trigger text |

## Replacement Strategy

### Phase 1 — Input Events API (`insertText`, `delete`)

Replace `execCommand("insertText")` and `execCommand("delete")` with the
[Input Events Level 2](https://w3c.github.io/input-events/) approach:

```js
// Before
document.execCommand("insertText", false, "\t");

// After — use Selection + Range API directly
const sel = window.getSelection();
const range = sel.getRangeAt(0);
range.deleteContents();
range.insertNode(document.createTextNode("\t"));
range.collapse(false);
```

This also applies to `deleteSlashText()` — replace `execCommand("delete")`
with `range.deleteContents()`.

**Tradeoff:** Direct DOM manipulation bypasses the browser's built-in undo
stack. To preserve undo/redo, either:
- Accept the tradeoff (most note-taking apps manage their own undo stack), or
- Implement a lightweight undo manager that records operations.

### Phase 2 — Manual Block Formatting (`formatBlock`, lists)

Replace `execCommand("formatBlock")`, `insertUnorderedList`, and
`insertOrderedList` with direct DOM manipulation:

```js
// Before
document.execCommand("formatBlock", false, "H1");

// After
const sel = window.getSelection();
let block = sel.getRangeAt(0).startContainer;
while (block && block.parentNode !== editor) block = block.parentNode;

const h1 = document.createElement("h1");
h1.innerHTML = block.innerHTML;
block.replaceWith(h1);

const range = document.createRange();
range.selectNodeContents(h1);
range.collapse(false);
sel.removeAllRanges();
sel.addRange(range);
```

For lists, build the `<ul>/<ol>` + `<li>` structure manually and replace the
current block.

### Phase 3 — Undo Stack

Once all `execCommand` calls are gone, the browser's native undo no longer
tracks edits. Implement a simple undo manager:

1. Snapshot `editor.innerHTML` on each `input` event (debounced).
2. Cap history at ~100 entries to bound memory.
3. Intercept `Ctrl+Z` / `Ctrl+Shift+Z` and restore from the stack.

A minimal implementation is ~40 lines. Libraries like
[prosemirror](https://prosemirror.net/) or [tiptap](https://tiptap.dev/)
provide this out of the box but would add significant bundle size.

## Alternative: Adopt a Lightweight Editor Library

If the editor's formatting needs grow, consider replacing the `contenteditable`
+ manual DOM approach entirely with one of:

| Library | Size (min+gz) | Notes |
|---------|---------------|-------|
| [Tiptap](https://tiptap.dev/) | ~45 kB | ProseMirror-based, extensible |
| [Lexical](https://lexical.dev/) | ~22 kB | Meta's editor framework |
| [Quill](https://quilljs.com/) | ~43 kB | Mature, well-documented |

This would eliminate all `execCommand` usage at once and provide a proper undo
stack, collaborative editing potential, and a plugin system. The tradeoff is
bundle size and added complexity for what is currently a zero-dependency project.

## Recommended Order

1. **Phase 1 first** — lowest risk, removes 2 of 6 call sites.
2. **Phase 2 next** — removes the remaining 4 call sites.
3. **Phase 3 last** — restores undo/redo after `execCommand` is fully removed.
4. Evaluate library adoption only if formatting requirements expand.
