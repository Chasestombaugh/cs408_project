const { test, expect } = require('@playwright/test');

test.describe('Landing Page', () => {
  test('should display landing page', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/RiftTracker/);
    await expect(page.getByRole('heading', { name: 'RiftTracker' })).toBeVisible();

    await expect(page.locator('body')).toContainText(
      'A lightweight personal performance dashboard for tracking League of Legends matches'
    );

    const getStarted = page.getByRole('link', { name: 'Get Started' });
    const viewStats = page.getByRole('link', { name: 'View Stats' });

    await expect(getStarted).toBeVisible();
    await expect(viewStats).toBeVisible();

    await expect(getStarted).toHaveAttribute('href', '/matches');
    await expect(viewStats).toHaveAttribute('href', '/stats');
  });
});
