import { expect, test } from '@playwright/test';

test.use({ storageState: 'playwright/.clerk/user.json' });

test('allows an authenticated user to open the protected application', async ({ page }) => {
  await page.goto('/home');

  await expect(page).not.toHaveURL(/\/auth(?:\?|$)/);
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
});
