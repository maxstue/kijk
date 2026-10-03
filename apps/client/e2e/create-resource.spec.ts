import { expect, test } from '@playwright/test';

test.use({ storageState: 'playwright/.clerk/user.json' });

test('creates a resource from the authenticated application', async ({ page }) => {
  await page.goto('/home');
  await page.getByRole('link', { name: 'Resources' }).click();

  await expect(page.getByRole('heading', { name: 'Resources' })).toBeVisible();
  await page.getByRole('button', { name: 'Create', exact: true }).click();

  const dialog = page.getByRole('dialog', { name: 'Create Resource' });
  await dialog.getByRole('textbox', { name: 'Name' }).fill('Solar energy');
  await dialog.getByRole('combobox', { name: 'Unit' }).click();
  await page.getByRole('option', { name: 'Kilowatt hour (kWh)' }).click();
  await dialog.getByRole('button', { name: 'Add' }).click();

  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'Solar energy' })).toBeVisible();
});
