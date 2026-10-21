import { expect, test } from '@playwright/test';

test.use({ storageState: 'playwright/.clerk/user.json' });

test('creates a resource from the authenticated application', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
  await page.getByRole('link', { name: 'Resources' }).click();

  await expect(page.getByRole('heading', { name: 'Resources' })).toBeVisible();
  await page.getByRole('button', { name: 'Add resource', exact: true }).click();

  const dialog = page.getByRole('dialog', { name: 'Create Resource' });
  await dialog.getByRole('textbox', { name: 'Name' }).fill('Solar energy');
  await dialog.getByRole('combobox', { name: 'Unit' }).click();
  await page.getByRole('option', { name: 'Kilowatt hour (kWh)' }).click();
  await dialog.getByRole('button', { name: 'Add' }).click();

  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'Solar energy' })).toBeVisible();
  await page.getByRole('button', { name: 'E2E Space', exact: true }).click();
  await page.getByRole('menuitem', { name: /Personal/ }).click();
  await page.getByRole('link', { name: 'Resources', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Resources' })).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'Solar energy' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Personal', exact: true }).click();
  await page.getByRole('menuitem', { name: /E2E Space/ }).click();
  await page.getByRole('link', { name: 'Resources', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: 'Solar energy' })).toBeVisible();
});
