import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should load dashboard page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Idea Forge');
  });

  test('should display idea generation form', async ({ page }) => {
    const form = page.locator('form[aria-label="Idea generation form"]');
    await expect(form).toBeVisible();

    const topicInput = form.locator('input[id="topic"]');
    await expect(topicInput).toBeVisible();
    await expect(topicInput).toHaveAttribute('required');
  });

  test('should validate form input', async ({ page }) => {
    const form = page.locator('form[aria-label="Idea generation form"]');
    const submitButton = form.locator('button[type="submit"]');

    // Try to submit empty form
    await submitButton.click();

    // Should show validation error
    await expect(page.locator('text=Topic is required')).toBeVisible();
  });

  test('should generate ideas when form is submitted', async ({ page, context }) => {
    // Mock API response
    await context.route('**/api/ideas/generate', async (route) => {
      const mockResponse = [
        'data: {"type":"status","data":{"status":"streaming"}}\n\n',
        'data: {"type":"idea","data":{"id":"test-id","title":"Test Idea","description":"Test description","tags":["test"],"author":"ai","createdAt":"2026-01-10T00:00:00.000Z"}}\n\n',
        'data: {"type":"done"}\n\n',
      ].join('');

      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: mockResponse,
      });
    });

    const form = page.locator('form[aria-label="Idea generation form"]');
    const topicInput = form.locator('input[id="topic"]');
    const submitButton = form.locator('button[type="submit"]');

    await topicInput.fill('AI for retail');
    await submitButton.click();

    // Wait for loading state
    await expect(page.locator('text=Generating ideas...')).toBeVisible();

    // Wait for idea to appear (with timeout)
    await expect(page.locator('text=Test Idea')).toBeVisible({ timeout: 5000 });
  });

  test('should be accessible', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toHaveLength(0);
  });

  test('should be keyboard navigable', async ({ page }) => {
    const form = page.locator('form[aria-label="Idea generation form"]');
    const topicInput = form.locator('input[id="topic"]');

    // Focus should be on topic input
    await topicInput.focus();
    await expect(topicInput).toBeFocused();

    // Tab through form elements
    await page.keyboard.press('Tab');
    // Should move to next focusable element
  });

  test('should handle errors gracefully', async ({ page, context }) => {
    // Mock API error
    await context.route('**/api/ideas/generate', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to generate ideas',
          },
        }),
      });
    });

    const form = page.locator('form[aria-label="Idea generation form"]');
    const topicInput = form.locator('input[id="topic"]');
    const submitButton = form.locator('button[type="submit"]');

    await topicInput.fill('Test topic');
    await submitButton.click();

    // Should show error message
    await expect(page.locator('text=Error')).toBeVisible({ timeout: 5000 });
  });
});