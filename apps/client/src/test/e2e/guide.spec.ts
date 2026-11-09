import { expect, test } from './fixtures';

test.use({ storageState: 'playwright/.clerk/user.json' });
const spaceId = '00000000-0000-4000-8000-000000000003';
const topics = ['dashboard', 'consumptions', 'resources', 'limits', 'finances', 'navigation'];

for (const mobile of [false, true]) {
  test(`native checklist and full tour work on ${mobile ? 'mobile' : 'desktop'}`, async ({
    page,
    upstreamRequests,
  }, testInfo) => {
    test.setTimeout(90_000);
    await page.setViewportSize(mobile ? { width: 375, height: 812 } : { width: 1280, height: 900 });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(`/${spaceId}`);
    if (mobile) {
      await page.getByRole('button', { name: 'Toggle Sidebar' }).click();
    }
    await page.locator('[data-guide="account"]').click();
    await page.getByRole('menuitem', { name: 'Getting started', exact: true }).click();
    const modal = page.getByRole('dialog', { name: 'Getting started' });
    await expect(modal.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '6');
    await expect(modal.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    await expect(modal.getByRole('button', { name: 'Explore finances' })).toHaveCount(0);
    await page.screenshot({ animations: 'disabled' });
    if (!mobile) {
      const rows = page.locator('.driver-checklist-item');
      const first = await rows.nth(0).boundingBox();
      const second = await rows.nth(1).boundingBox();
      expect(Math.abs(first!.y - second!.y)).toBeLessThan(2);
      expect((await modal.boundingBox())!.width).toBeGreaterThan(600);
      await rows.first().hover();
      await page.screenshot({ animations: 'disabled' });
      await expect(rows.first()).not.toHaveCSS('background-color', 'rgb(247, 247, 247)');
    }
    await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('checklist.png') });
    await modal.getByRole('button', { name: 'Get to know Kijk' }).click();
    const pages = [
      'Consumptions',
      'Resources',
      'Limits',
      'Accounts',
      'Transactions',
      'Categories',
      'Budgets',
      'Imports',
    ];
    const expected = ['Your dashboard'];
    for (const title of pages) {
      if (!mobile) {
        expected.push(`Open ${title}`);
      }
      expected.push(title);
      if (title === 'Consumptions') {
        expected.push('Record a reading or consumption');
      }
    }
    expected.push('Switch spaces and open settings');
    for (const [index, title] of expected.entries()) {
      const popup = page.locator('.driver-popover');
      await expect(popup.locator('.driver-popover-title')).toHaveText(title);
      const button = popup.getByRole('button', { name: index === expected.length - 1 ? 'Done' : 'Next', exact: true });
      await expect(button).toBeEnabled();
      if (title === 'Consumptions' && !mobile) {
        await popup.locator('.driver-popover-title').hover();
        await page.screenshot({ animations: 'disabled' });
        const before = await button.evaluate((element) => getComputedStyle(element).backgroundColor);
        await button.hover();
        await expect
          .poll(() => button.evaluate((element) => getComputedStyle(element).backgroundColor))
          .not.toBe(before);
        await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('tour-buttons-hover.png') });
      }
      await button.click();
    }
    await expect(page.locator('.driver-popover')).not.toBeVisible();
    if (mobile) {
      await page.getByRole('button', { name: 'Toggle Sidebar' }).click();
    }
    await page.locator('[data-guide="account"]').click();
    await page.getByRole('menuitem', { name: 'Getting started', exact: true }).click();
    await expect(modal.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(topics.length));
    await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('checklist-completed.png') });
    const writes = (await upstreamRequests()).filter((request) => request.method !== 'GET');
    expect(writes).toHaveLength(topics.length);
    expect(writes.every((request) => request.path === '/api/users/me/guide' && request.method === 'PATCH')).toBe(true);
  });
}

test('each row starts a subtour and the finance checkbox completes only finances', async ({
  page,
  upstreamRequests,
}) => {
  await page.goto(`/${spaceId}`);
  await page.locator('[data-guide="account"]').click();
  await page.getByRole('menuitem', { name: 'Getting started' }).click();
  await page.getByRole('button', { name: /^Finances/ }).click();
  await expect(page.locator('.driver-popover-title')).toHaveText('Accounts');
  for (const title of ['Transactions', 'Categories', 'Budgets', 'Imports']) {
    await page.locator('.driver-popover').getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.locator('.driver-popover-title')).toHaveText(`Open ${title}`);
    await page.locator('.driver-popover').getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.locator('.driver-popover-title')).toHaveText(title);
  }
  await page.locator('.driver-popover').getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.locator('.driver-popover')).not.toBeVisible();
  await page.locator('[data-guide="account"]').click();
  await page.getByRole('menuitem', { name: 'Getting started' }).click();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  await expect(page.locator('[data-item-id="finances"]').locator('..')).toHaveClass(/driver-checklist-item-done/);
  expect((await upstreamRequests()).filter((request) => request.method !== 'GET')).toHaveLength(1);
});

test('the user-menu modal replaces the administration page and never shows a reminder control', async ({
  page,
  upstreamRequests,
}) => {
  await page.goto('/settings/profile');
  await expect(page.getByRole('link', { name: 'Getting started', exact: true })).toHaveCount(0);
  await page.locator('[data-guide="account"]').click();
  await page.getByRole('menuitem', { name: 'Getting started', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Getting started' })).toBeVisible();
  await expect(page.getByRole('button', { name: /progress reminder/ })).toHaveCount(0);
  await page.getByRole('button', { name: /^Spaces & settings/ }).click();
  await expect(page.locator('.driver-popover-title')).toHaveText('Switch spaces and open settings');
  await page.keyboard.press('Escape');
  await expect(page.locator('.driver-popover')).not.toBeVisible();
  expect((await upstreamRequests()).filter((request) => request.method === 'PATCH')).toHaveLength(0);
});
