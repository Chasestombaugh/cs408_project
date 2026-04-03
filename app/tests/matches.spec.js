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

  test('should create a new match from the add match form', async ({ page }) => {
  await page.goto('/matches/new');

  await page.getByLabel('Username').fill('CheckpointUser');
  await page.getByLabel('Date Played').fill('2026-03-25');
  await page.getByLabel('Mode').selectOption('SR');
  await page.getByLabel('Champion').fill('Ashe');
  await page.getByLabel('Role').selectOption('ADC');
  await page.getByLabel('Result').selectOption('Win');
  await page.getByLabel('Kills').fill('8');
  await page.getByLabel('Deaths').fill('2');
  await page.getByLabel('Assists').fill('11');
  await page.getByLabel('Notes').fill('Strong laning phase.');

  // Optional advanced stats
  await page.getByText('Advanced Statistics (Optional)').click();
  await page.getByLabel('Game Duration (mm:ss)').fill('28:15');
  await page.getByLabel('Total Gold').fill('14500');
  await page.getByLabel('Total CS').fill('210');

  await page.getByRole('button', { name: 'Save Match' }).click();

  await expect(page).toHaveURL(/\/matches\?user=CheckpointUser/);
  await expect(page.locator('body')).toContainText('Viewing matches for: CheckpointUser');
  await expect(page.locator('body')).toContainText('Ashe');
  await expect(page.locator('body')).toContainText('SR');
  await expect(page.locator('body')).toContainText('ADC');
  await expect(page.locator('body')).toContainText('Win');
  await expect(page.locator('body')).toContainText('8 / 2 / 11');
  await expect(page.locator('body')).toContainText('28:15');
  });
});