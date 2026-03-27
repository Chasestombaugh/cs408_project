const { test, expect } = require('@playwright/test');

test.describe('Matches Page', () => {
  test('should display matches page and username filter', async ({ page }) => {
    await page.goto('/matches');

    await expect(page).toHaveTitle(/Matches/);
    await expect(page.getByRole('heading', { name: 'Matches' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter username')).toBeVisible();
    await expect(page.getByRole('button', { name: 'View' })).toBeVisible();
  });

  test('should seed and display filtered matches for TravisSqrt', async ({ page }) => {
    await page.goto('/debug/seed');
    await page.goto('/matches?user=TravisSqrt');

    await expect(page.locator('body')).toContainText('Viewing matches for: TravisSqrt');
    await expect(page.locator('body')).toContainText('Twitch');
    await expect(page.locator('body')).toContainText('ARAM');
    await expect(page.locator('body')).toContainText('SR');
    await expect(page.locator('body')).toContainText('14:29');
  });
});