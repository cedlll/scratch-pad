/**
 * Debounce Utility
 * Delays function execution until after a specified wait time has elapsed
 * since the last time it was invoked
 */

/**
 * Creates a debounced function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(fn, delay) {
  let timeoutId = null;

  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * Creates a throttled function that only invokes fn at most once per wait period
 * @param {Function} fn - Function to throttle
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Throttled function
 */
export function throttle(fn, wait) {
  let lastCallTime = 0;
  let timeoutId = null;

  return function throttled(...args) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall >= wait) {
      lastCallTime = now;
      fn.apply(this, args);
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        fn.apply(this, args);
      }, wait - timeSinceLastCall);
    }
  };
}

/**
 * Debounce for requestAnimationFrame
 * @param {Function} fn - Function to call on next animation frame
 * @returns {Function} - RAF-debounced function
 */
export function rafDebounce(fn) {
  let rafId = null;

  return function rafDebounced(...args) {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
    rafId = requestAnimationFrame(() => {
      fn.apply(this, args);
      rafId = null;
    });
  };
}
