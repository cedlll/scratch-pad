/**
 * Enhanced Markdown Parser
 * Converts markdown to HTML with support for:
 * - Headings (# ## ###)
 * - Lists (ordered, unordered, todos)
 * - Blockquotes (>)
 * - Horizontal rules (---)
 * - Inline formatting (bold, italic, code, links)
 * - Code blocks (```)
 */

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Raw text
 * @returns {string} - HTML-escaped text
 */
function escapeHtml(text) {
  const el = document.createElement('span');
  el.textContent = text;
  return el.innerHTML;
}

/**
 * Parse inline markdown formatting
 * @param {string} text - Text with markdown syntax
 * @returns {string} - HTML with inline formatting
 */
function parseInline(text) {
  let html = escapeHtml(text);

  // Process inline code FIRST (before links to avoid breaking code in links)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Links: [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Bold: **text** or __text__
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // Italic: *text* or _text_ (Safari-compatible - no lookbehind)
  html = html.replace(/\*([^*]+)\*/g, (match, p1, offset, string) => {
    // Don't match if preceded or followed by another *
    if (offset > 0 && string[offset - 1] === '*') return match;
    if (offset + match.length < string.length && string[offset + match.length] === '*') return match;
    return `<em>${p1}</em>`;
  });
  html = html.replace(/_([^_]+)_/g, (match, p1, offset, string) => {
    // Don't match if preceded or followed by another _
    if (offset > 0 && string[offset - 1] === '_') return match;
    if (offset + match.length < string.length && string[offset + match.length] === '_') return match;
    return `<em>${p1}</em>`;
  });

  return html;
}

/**
 * Parse markdown to HTML
 * @param {string} md - Markdown text
 * @returns {string} - HTML
 */
export function parseMarkdownToHTML(md) {
  const lines = md.split('\n');
  const parts = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code blocks (```language)
    if (line.startsWith('```')) {
      const codeLines = [];
      const language = line.substring(3).trim() || '';
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(escapeHtml(lines[i]));
        i++;
      }
      const codeClass = language ? ` class="language-${escapeHtml(language)}"` : '';
      parts.push(`<pre><code${codeClass}>${codeLines.join('\n')}</code></pre>`);
      i++;
      continue;
    }

    // Horizontal rules (---, ***, ___)
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      parts.push('<hr>');
      i++;
      continue;
    }

    // Headings
    const h3 = line.match(/^### (.+)/);
    if (h3) {
      parts.push(`<h3>${parseInline(h3[1])}</h3>`);
      i++;
      continue;
    }
    const h2 = line.match(/^## (.+)/);
    if (h2) {
      parts.push(`<h2>${parseInline(h2[1])}</h2>`);
      i++;
      continue;
    }
    const h1 = line.match(/^# (.+)/);
    if (h1) {
      parts.push(`<h1>${parseInline(h1[1])}</h1>`);
      i++;
      continue;
    }

    // Todo items (- [ ] or - [x])
    const todo = line.match(/^[-*+] \[([ xX])\] (.*)/);
    if (todo) {
      const checked = todo[1] !== ' ';
      const text = todo[2] || '\u00A0';
      parts.push(
        `<div class="todo-item${checked ? ' checked' : ''}">` +
        `<input type="checkbox"${checked ? ' checked' : ''} contenteditable="false" aria-label="Mark task complete">` +
        `<span class="todo-text">${parseInline(text)}</span></div>`
      );
      i++;
      continue;
    }

    // Unordered lists (-, *, +)
    if (/^[-*+] /.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*+] /.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+] /, ''));
        i++;
      }
      parts.push('<ul>' + items.map(t => `<li>${parseInline(t)}</li>`).join('') + '</ul>');
      continue;
    }

    // Ordered lists (1. 2. 3.)
    if (/^\d+[.)] /.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+[.)] /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+[.)] /, ''));
        i++;
      }
      parts.push('<ol>' + items.map(t => `<li>${parseInline(t)}</li>`).join('') + '</ol>');
      continue;
    }

    // Blockquotes (>)
    if (/^>/.test(line)) {
      const qLines = [];
      while (i < lines.length && /^>/.test(lines[i])) {
        qLines.push(lines[i].replace(/^> ?/, ''));
        i++;
      }
      parts.push(`<blockquote>${qLines.map(l => parseInline(l)).join('<br>')}</blockquote>`);
      continue;
    }

    // Empty lines
    if (!line.trim()) {
      parts.push('<div><br></div>');
      i++;
      continue;
    }

    // Plain text (with inline formatting)
    parts.push(`<div>${parseInline(line)}</div>`);
    i++;
  }

  return parts.join('') || '<br>';
}
