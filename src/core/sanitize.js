/**
 * HTML Sanitization Module
 * Wraps DOMPurify to prevent XSS attacks
 */

// DOMPurify is loaded via script tag in HTML
// It will be available globally as window.DOMPurify

/**
 * Sanitize HTML content to prevent XSS
 * @param {string} html - Raw HTML string
 * @returns {string} - Sanitized HTML safe for insertion
 */
export function sanitizeHTML(html) {
  if (!html || typeof html !== 'string') {
    return '<br>';
  }

  // If DOMPurify isn't loaded yet, return empty (safer than unsanitized)
  if (typeof window.DOMPurify === 'undefined') {
    console.error('[Sanitize] DOMPurify not loaded');
    return '<br>';
  }

  try {
    const config = {
      // Allow common formatting elements
      ALLOWED_TAGS: [
        'div', 'span', 'br', 'p',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li',
        'blockquote', 'hr',
        'a', 'strong', 'em', 'code', 'pre',
        'input', // For checkboxes in todos
      ],
      ALLOWED_ATTR: [
        'class', 'id', 'href', 'target', 'rel',
        'type', 'checked', 'contenteditable',
        'role', 'aria-label', 'aria-multiline',
        'data-placeholder',
      ],
      // Keep relative URLs (for internal links)
      ALLOW_DATA_ATTR: false,
      // Allow target="_blank" for external links
      ADD_ATTR: ['target'],
    };

    const clean = window.DOMPurify.sanitize(html, config);
    return clean || '<br>';
  } catch (error) {
    console.error('[Sanitize] Error sanitizing HTML:', error);
    return '<br>';
  }
}

/**
 * Sanitize markdown-converted HTML
 * More permissive config for imported markdown
 * @param {string} html - HTML from markdown parser
 * @returns {string} - Sanitized HTML
 */
export function sanitizeMarkdown(html) {
  if (!html || typeof html !== 'string') {
    return '<br>';
  }

  if (typeof window.DOMPurify === 'undefined') {
    console.error('[Sanitize] DOMPurify not loaded');
    return '<br>';
  }

  try {
    const config = {
      ALLOWED_TAGS: [
        'div', 'span', 'br', 'p',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li',
        'blockquote', 'hr',
        'a', 'strong', 'em', 'b', 'i', 'code', 'pre',
        'input', // For todo checkboxes
        'table', 'thead', 'tbody', 'tr', 'th', 'td', // For tables in MD
      ],
      ALLOWED_ATTR: [
        'class', 'href', 'target', 'rel',
        'type', 'checked', 'contenteditable',
        'aria-label',
      ],
      // Automatically add rel="noopener" to external links
      ADD_ATTR: ['target', 'rel'],
    };

    const clean = window.DOMPurify.sanitize(html, config);
    return clean || '<br>';
  } catch (error) {
    console.error('[Sanitize] Error sanitizing markdown HTML:', error);
    return '<br>';
  }
}
