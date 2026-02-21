/**
 * Unit tests for Markdown parser
 * Run with: npm test
 */

import { describe, it, expect } from 'vitest';
import { parseMarkdownToHTML } from '../../src/utils/markdown.js';

describe('Markdown Parser', () => {
  describe('Headings', () => {
    it('should parse H1', () => {
      const result = parseMarkdownToHTML('# Heading 1');
      expect(result).toContain('<h1>Heading 1</h1>');
    });

    it('should parse H2', () => {
      const result = parseMarkdownToHTML('## Heading 2');
      expect(result).toContain('<h2>Heading 2</h2>');
    });

    it('should parse H3', () => {
      const result = parseMarkdownToHTML('### Heading 3');
      expect(result).toContain('<h3>Heading 3</h3>');
    });
  });

  describe('Inline Formatting', () => {
    it('should parse bold with **', () => {
      const result = parseMarkdownToHTML('**bold text**');
      expect(result).toContain('<strong>bold text</strong>');
    });

    it('should parse bold with __', () => {
      const result = parseMarkdownToHTML('__bold text__');
      expect(result).toContain('<strong>bold text</strong>');
    });

    it('should parse italic with *', () => {
      const result = parseMarkdownToHTML('*italic text*');
      expect(result).toContain('<em>italic text</em>');
    });

    it('should parse inline code', () => {
      const result = parseMarkdownToHTML('`code here`');
      expect(result).toContain('<code>code here</code>');
    });

    it('should parse links', () => {
      const result = parseMarkdownToHTML('[Click here](https://example.com)');
      expect(result).toContain('<a href="https://example.com"');
      expect(result).toContain('Click here</a>');
      expect(result).toContain('target="_blank"');
    });
  });

  describe('Lists', () => {
    it('should parse unordered lists', () => {
      const result = parseMarkdownToHTML('- Item 1\n- Item 2');
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>Item 1</li>');
      expect(result).toContain('<li>Item 2</li>');
    });

    it('should parse ordered lists', () => {
      const result = parseMarkdownToHTML('1. First\n2. Second');
      expect(result).toContain('<ol>');
      expect(result).toContain('<li>First</li>');
      expect(result).toContain('<li>Second</li>');
    });

    it('should parse todo items', () => {
      const result = parseMarkdownToHTML('- [ ] Todo\n- [x] Done');
      expect(result).toContain('class="todo-item"');
      expect(result).toContain('checkbox');
      expect(result).toContain('checked');
    });
  });

  describe('Code Blocks', () => {
    it('should parse code blocks', () => {
      const md = '```javascript\nconst x = 1;\n```';
      const result = parseMarkdownToHTML(md);
      expect(result).toContain('<pre><code');
      expect(result).toContain('const x = 1;');
    });
  });

  describe('Blockquotes', () => {
    it('should parse blockquotes', () => {
      const result = parseMarkdownToHTML('> Quote here');
      expect(result).toContain('<blockquote>');
      expect(result).toContain('Quote here');
    });
  });

  describe('Security', () => {
    it('should escape HTML in plain text', () => {
      const result = parseMarkdownToHTML('<script>alert(1)</script>');
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });
  });
});
