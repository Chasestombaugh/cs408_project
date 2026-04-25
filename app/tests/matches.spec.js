const { test, expect } = require('@playwright/test');

test.describe('Matches Page', () => {
  test.describe.configure({ mode: 'serial' });

  test('should display matches page and username filter', async ({ page }) => {
    await page.goto('/matches');

    await expect(page).toHaveTitle(/Matches/);
    await expect(page.getByRole('heading', { name: 'Matches', exact: true })).toBeVisible();
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

  test('should display match detail page for a seeded SR match', async ({ page }) => {
  await page.goto('/debug/seed');
  await page.goto('/matches?user=TravisSqrt');

  const srRow = page.locator('tbody tr').filter({ hasText: 'SR' });
  await expect(srRow).toHaveCount(1);
  await srRow.getByRole('link', { name: 'View' }).click();

  await expect(page).toHaveTitle(/Match Details/);
  await expect(page.getByRole('heading', { name: 'Match Details' })).toBeVisible();

  await expect(page.locator('body')).toContainText('Twitch');
  await expect(page.locator('body')).toContainText('SR');
  await expect(page.locator('body')).toContainText('ADC');
  await expect(page.locator('body')).toContainText('Loss');
  await expect(page.locator('body')).toContainText('10 / 7 / 13');
  await expect(page.locator('body')).toContainText('14:29');

  await expect(page.locator('body')).toContainText('Advanced Statistics');
  await expect(page.locator('body')).toContainText('13117');
  await expect(page.locator('body')).toContainText('57');
  await expect(page.locator('body')).toContainText('20611');
  await expect(page.locator('body')).toContainText('16362');
  });

  test('should handle invalid match IDs gracefully', async ({ page }) => {
  await page.goto('/matches/9999');

  await expect(page).toHaveTitle(/Match Details/);
  await expect(page.locator('body')).toContainText('Match not found.');
  });

  test('should edit an existing match and save updated values', async ({ page }) => {
  await page.goto('/debug/seed');
  await page.goto('/matches?user=TravisSqrt');

  const srRow = page.locator('tbody tr').filter({ hasText: 'SR' });
  await expect(srRow).toHaveCount(1);

  await srRow.getByRole('link', { name: 'Edit' }).click();

  await expect(page).toHaveTitle(/Edit Match/);
  await expect(page.getByRole('heading', { name: 'Edit Match' })).toBeVisible();

  // Verify form is pre-populated
  await expect(page.getByLabel('Champion')).toHaveValue('Twitch');
  await expect(page.getByLabel('Role')).toHaveValue('ADC');
  await expect(page.getByLabel('Kills')).toHaveValue('10');

  // Update a few fields
  await page.getByLabel('Champion').fill('Jinx');
  await page.getByLabel('Kills').fill('12');
  await page.getByLabel('Deaths').fill('4');
  await page.getByLabel('Assists').fill('16');
  await page.getByLabel('Notes').fill('Updated during edit flow.');

  await page.getByRole('button', { name: 'Save Changes' }).click();

  // Should redirect back to detail page
  await expect(page).toHaveURL(/\/matches\/\d+$/);
  await expect(page.getByRole('heading', { name: 'Match Details' })).toBeVisible();

  // Confirm updated values appear
  await expect(page.locator('body')).toContainText('Jinx');
  await expect(page.locator('body')).toContainText('12 / 4 / 16');
  await expect(page.locator('body')).toContainText('Updated during edit flow.');
  });

  test('should delete a match and remove it from the list', async ({ page }) => {
  await page.goto('/debug/seed');
  await page.goto('/matches?user=TravisSqrt');

  const srRow = page.locator('tbody tr').filter({ hasText: 'SR' });
  await expect(srRow).toHaveCount(1);

  await srRow.getByRole('button', { name: 'Delete' }).click();

  await expect(page).toHaveURL(/\/matches\?user=TravisSqrt/);
  await expect(page.locator('tbody tr').filter({ hasText: 'SR' })).toHaveCount(0);
  await expect(page.locator('body')).toContainText('ARAM');
  });

  test('should display username-filtered stats with derived metrics', async ({ page }) => {
  await page.goto('/debug/seed');
  await page.goto('/stats?user=TravisSqrt&range=all');

  await expect(page).toHaveTitle(/Statistics/);
  await expect(page.getByRole('heading', { name: 'Statistics' })).toBeVisible();

  await expect(page.locator('body')).toContainText('Viewing stats for: TravisSqrt');
  await expect(page.locator('body')).toContainText('Total Matches');
  await expect(page.locator('body')).toContainText('Win Rate');
  await expect(page.locator('body')).toContainText('Average KDA');
  await expect(page.locator('body')).toContainText('Derived Metrics');

  await expect(page.locator('body')).toContainText('Matches by Mode');
  await expect(page.locator('body')).toContainText('SR');
  await expect(page.locator('body')).toContainText('ARAM');

  await expect(page.locator('body')).toContainText('Most Played Champions');
  await expect(page.locator('body')).toContainText('Twitch');

  await expect(page.locator('body')).toContainText('Avg Damage');
  });
});