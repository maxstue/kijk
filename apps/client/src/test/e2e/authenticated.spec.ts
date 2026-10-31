import { expect, test } from './fixtures';

test.use({ storageState: 'playwright/.clerk/user.json' });

test('allows an authenticated user to open the protected application', async ({ page }) => {
  await page.goto('/');

  await expect(page).not.toHaveURL(/\/auth(?:\?|$)/);
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
});

const sharedId = '00000000-0000-4000-8000-000000000003';
const personalId = '00000000-0000-4000-8000-000000000005';

test('switches by URL and keeps another tab in its own space', async ({ page, context }) => {
  test.setTimeout(60_000);
  const defaultRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/users/default-space')) {
      defaultRequests.push(request.url());
    }
  });
  await page.goto('/');
  await expect(page).toHaveURL(new RegExp(`/${sharedId}$`));
  const otherTab = await context.newPage();
  await otherTab.goto(`/${sharedId}`, { waitUntil: 'domcontentloaded' });
  await expect(otherTab.getByRole('heading', { name: 'Home' })).toBeVisible();
  await page.getByRole('button', { name: 'E2E Space', exact: true }).click();
  await page.getByRole('menuitem', { name: /Personal/ }).click();
  await expect(page).toHaveURL(new RegExp(`/${personalId}$`));
  await expect(otherTab).toHaveURL(new RegExp(`/${sharedId}$`));
  expect(defaultRequests).toEqual([]);
  await otherTab.close();
});

test('account settings can clear the default and return to the last visited space', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto(`/${personalId}`);
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
  await page.goto('/settings/profile', { waitUntil: 'domcontentloaded' });
  const defaultSpace = page.getByRole('combobox', { name: 'Default space' });
  await expect(defaultSpace).toHaveText('E2E Space');
  await defaultSpace.click();
  const saved = page.waitForResponse(
    (response) => response.url().endsWith('/api/users/default-space') && response.ok(),
  );
  await page.getByRole('option', { name: 'None — use the last visited space' }).click();
  await saved;
  await expect(page).toHaveURL(/\/settings\/profile$/);
  await page.getByRole('link', { name: 'Back to app' }).click();
  await expect(page).toHaveURL(new RegExp(`/${personalId}$`));
});
