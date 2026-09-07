import { expect, test } from '@playwright/test';

test('allows an authenticated user to open the protected application', async ({ page }) => {
  await page.goto('/home');

  await expect(page).not.toHaveURL(/\/auth(?:\?|$)/);
  await expect(page.getByText('Home', { exact: true }).first()).toBeVisible();
});
