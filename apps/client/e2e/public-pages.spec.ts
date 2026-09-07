import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { expect, test } from '@playwright/test';

test('shows the privacy policy', async ({ page }) => {
  await setupClerkTestingToken({ page });
  await page.goto('/privacy');

  await expect(page).toHaveTitle(/Kijk/);
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Technical error reporting' })).toBeVisible();
});

test('shows the terms of service', async ({ page }) => {
  await setupClerkTestingToken({ page });
  await page.goto('/terms');

  await expect(page.getByRole('heading', { level: 1, name: 'Terms of Service' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Acceptable use' })).toBeVisible();
});

test('redirects an unauthenticated user from a protected route', async ({ page }) => {
  await setupClerkTestingToken({ page });
  await page.goto('/home');

  await expect(page).toHaveURL(/\/auth\?from=/);
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
});
