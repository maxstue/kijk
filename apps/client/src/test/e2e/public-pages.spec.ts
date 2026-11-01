import { setupClerkTestingToken } from '@clerk/testing/playwright';

import { expect, test } from './fixtures';

test('public pages deliver their content before JavaScript runs', async ({ request }) => {
  for (const [path, content] of [
    ['/', 'Understand and plan what you use.'],
    ['/privacy', 'Privacy Policy'],
    ['/terms', 'Terms of Service'],
    ['/imprint', 'Imprint'],
  ]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/html');
    expect(await response.text()).toContain(content);
  }
  expect((await request.get('/not/a/real/route')).status()).toBe(404);
  expect((await request.get('/health')).status()).toBe(200);
});

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
  await page.goto('/11111111-1111-4111-8111-111111111111');

  await expect(page).toHaveURL(/\/auth\?from=/);
  await expect(page.getByText('Welcome back', { exact: true })).toBeVisible();
});
