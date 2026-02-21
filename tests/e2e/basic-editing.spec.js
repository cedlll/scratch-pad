/**
 * E2E tests for basic editing functionality
 * Run with: npm run test:e2e
 */

import { test, expect } from '@playwright/test';

test.describe('Basic Editing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:3000/app.html');
    await page.waitForSelector('#editor');
  });

  test('should load the editor', async ({ page }) => {
    const editor = page.locator('#editor');
    await expect(editor).toBeVisible();
    await expect(editor).toHaveAttribute('contenteditable', 'true');
  });

  test('should allow typing', async ({ page }) => {
    const editor = page.locator('#editor');
    await editor.click();
    await editor.type('Hello, World!');

    await expect(editor).toContainText('Hello, World!');
  });

  test('should show placeholder when empty', async ({ page }) => {
    const editor = page.locator('#editor');
    await expect(editor).toHaveClass(/is-empty/);
  });

  test('should hide placeholder when typing', async ({ page }) => {
    const editor = page.locator('#editor');
    await editor.click();
    await editor.type('Text');

    await expect(editor).not.toHaveClass(/is-empty/);
  });

  test('should auto-save content', async ({ page }) => {
    const editor = page.locator('#editor');
    await editor.click();
    await editor.type('Auto-saved text');

    // Wait for debounced save
    await page.waitForTimeout(600);

    // Reload page
    await page.reload();
    await page.waitForSelector('#editor');

    // Content should persist
    await expect(editor).toContainText('Auto-saved text');
  });
});
