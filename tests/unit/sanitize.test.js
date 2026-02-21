/**
 * Unit tests for HTML sanitization
 * Run with: npm test
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { sanitizeHTML, sanitizeMarkdown } from '../../src/core/sanitize.js';

// Mock DOMPurify for testing
beforeAll(() => {
  global.window = {
    DOMPurify: {
      sanitize: (html, config) => {
        // Simple mock that removes script tags
        return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      }
    }
  };
});

describe('HTML Sanitization', () => {
  it('should remove script tags', () => {
    const malicious = '<div>Hello<script>alert("XSS")</script></div>';
    const result = sanitizeHTML(malicious);
    expect(result).not.toContain('<script>');
    expect(result).toContain('Hello');
  });

  it('should preserve safe HTML', () => {
    const safe = '<div class="todo-item"><strong>Safe content</strong></div>';
    const result = sanitizeHTML(safe);
    expect(result).toContain('Safe content');
  });

  it('should handle null/undefined', () => {
    expect(sanitizeHTML(null)).toBe('<br>');
    expect(sanitizeHTML(undefined)).toBe('<br>');
    expect(sanitizeHTML('')).toBe('<br>');
  });

  it('should sanitize markdown-converted HTML', () => {
    const md = '<h1>Title</h1><p>Content</p>';
    const result = sanitizeMarkdown(md);
    expect(result).toContain('Title');
    expect(result).toContain('Content');
  });
});
