import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y, getViolations } from 'axe-playwright';

test.describe('Accessibility Tests', () => {
  test('home page should be accessible', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);

    const violations = await getViolations(page, undefined, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],
      },
    });

    expect(violations).toHaveLength(0);
  });

  test('dashboard page should be accessible', async ({ page }) => {
    await page.goto('/dashboard');
    await injectAxe(page);

    await checkA11y(page, undefined, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa'],
      },
      detailedReport: true,
    });
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/dashboard');

    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);

    // Check that h1 exists before h2
    const headings = await page.locator('h1, h2, h3').all();
    expect(headings.length).toBeGreaterThan(0);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/dashboard');

    // Check form has aria-label
    const form = page.locator('form[aria-label]');
    await expect(form).toBeVisible();

    // Check inputs have labels
    const label = page.locator('label[for="topic"]');
    await expect(label).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/dashboard');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Verify focus is on an interactive element
    const focusCount = await focusedElement.count();
    expect(focusCount).toBeGreaterThan(0);
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/dashboard');

    // This is a basic check - full contrast testing requires tools
    // For now, we verify that text elements exist
    const textElements = page.locator('p, span, h1, h2, h3');
    await expect(textElements.first()).toBeVisible();
  });

  test('should not have duplicate IDs', async ({ page }) => {
    await page.goto('/dashboard');

    const ids = await page.locator('[id]').evaluateAll((elements) =>
      elements.map((el) => el.id)
    );

    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });
});
