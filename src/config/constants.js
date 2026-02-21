/**
 * Application Constants
 * Centralized configuration to avoid magic numbers
 */

export const STORAGE = {
  CONTENT_KEY: 'scratchpad_content',
  THEME_KEY: 'scratchpad_theme',
};

export const TIMING = {
  SAVE_DEBOUNCE_MS: 500,
  SELECTION_DEBOUNCE_MS: 10,
  TOAST_DURATION_MS: 3000,
  PLACEHOLDER_DEBOUNCE_MS: 100,
};

export const MENU = {
  WIDTH: 280,
  MAX_HEIGHT: 340,
  OFFSET: 6,
  VIEWPORT_PADDING: 10,
};

export const VALIDATION = {
  URL_REGEX: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_FILE_TYPES: ['.md', '.markdown', 'text/markdown'],
};

export const HISTORY = {
  MAX_SIZE: 50,
  SNAPSHOT_DEBOUNCE_MS: 500,
};
