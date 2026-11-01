import { expect, test } from './fixtures';
import { mockApiOrigin } from './mock-api/config';

const sharedId = '00000000-0000-4000-8000-000000000003';
const personalId = '00000000-0000-4000-8000-000000000005';

test.use({ storageState: 'playwright/.clerk/user.json' });

test('shows real annual series, selected month totals and limit boundary states', async ({
  page,
  upstreamRequests,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto(`/${sharedId}?year=2025&month=9`);
  const finances = page.getByRole('region', { name: 'Finances', exact: true });
  const consumptions = page.getByRole('region', { name: 'Consumptions', exact: true });
  const limits = page.getByRole('region', { name: 'Limits', exact: true });
  await expect(finances.getByText('1,008 EUR', { exact: true })).toBeVisible();
  await expect(consumptions.getByText('18 kWh', { exact: true })).toBeVisible();
  const plotBox = await consumptions.getByRole('img').boundingBox();
  const sectionBox = await consumptions.boundingBox();
  expect(plotBox!.width).toBeGreaterThan(sectionBox!.width * 0.8);
  await consumptions.getByText('Monthly values · 2025', { exact: true }).click();
  const table = consumptions.getByRole('table');
  await expect(table.getByRole('row')).toHaveCount(13);
  await expect(
    table
      .getByRole('row')
      .filter({ has: page.getByRole('rowheader', { name: 'Jan', exact: true }) })
      .getByRole('cell'),
  ).toHaveText('0');
  await expect(
    table
      .getByRole('row')
      .filter({ has: page.getByRole('rowheader', { name: 'Dec', exact: true }) })
      .getByRole('cell'),
  ).toHaveText('21');
  await expect(limits.getByText('90 %', { exact: true })).toBeVisible();
  const zero = limits.getByRole('article').filter({ hasText: 'Zero allowance' });
  await expect(zero.getByText('Exceeded by 5 kWh', { exact: true })).toBeVisible();
  await expect(zero.getByRole('progressbar')).toHaveCount(0);
  await page.getByRole('button', { name: 'Next month', exact: true }).click();
  await expect(limits.getByRole('article').filter({ hasText: 'Monthly electricity' })).toContainText('Limit reached');
  await page.getByRole('button', { name: 'Next month', exact: true }).click();
  await expect(limits.getByText('110 %', { exact: true })).toBeVisible();
  await expect(limits.getByText('Exceeded by 10 kWh', { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(consumptions.getByRole('img', { name: 'January to December 2025, kWh' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  for (const request of (await upstreamRequests()).filter((item) => item.path.includes('/dashboard/'))) {
    expect(request.headers.authorization).toBe('Bearer');
    expect(request.headers).not.toHaveProperty('cookie');
    expect(request.headers).not.toHaveProperty('x-csrf');
  }
});

test('changes month and year consistently and restores the period after reload', async ({ page, upstreamRequests }) => {
  await page.goto(`/${sharedId}?year=2025&month=12`);
  const consumptions = page.getByRole('region', { name: 'Consumptions', exact: true });
  await expect(consumptions.getByText('21 kWh', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Next month', exact: true }).click();
  await expect(page).toHaveURL(/year=2026/);
  await expect(page).toHaveURL(/month=1(?:&|$)/);
  await expect(page.getByRole('heading', { name: 'Space overview · Jan 2026' })).toBeVisible();
  await expect(consumptions.getByText('0 kWh', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Finances', exact: true }).getByText('1,001 EUR', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Limits', exact: true }).getByText('Monthly electricity', { exact: true }),
  ).toHaveCount(0);
  const requests = await upstreamRequests();
  for (const section of ['finances', 'budgets', 'consumptions', 'limits']) {
    expect(
      requests.some(
        (item) =>
          item.path.endsWith(`/dashboard/${section}`) && new URLSearchParams(item.search).get('year') === '2026',
      ),
    ).toBe(true);
  }
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Space overview · Jan 2026' })).toBeVisible();
  await expect(consumptions.getByText('0 kWh', { exact: true })).toBeVisible();
});

test('switches spaces without displaying the previous space data', async ({ page, upstreamRequests }) => {
  await page.goto(`/${sharedId}?year=2025&month=9`);
  await expect(page.getByRole('term').filter({ hasText: 'Shared electricity' })).toBeVisible();
  await page.getByRole('button', { name: 'E2E Space', exact: true }).click();
  await page.getByRole('menuitem', { name: /Personal/ }).click();
  await expect(page).toHaveURL(new RegExp(`/${personalId}`));
  await expect(page.getByRole('term').filter({ hasText: 'Personal electricity' })).toBeVisible();
  await expect(page.getByRole('term').filter({ hasText: 'Shared electricity' })).toHaveCount(0);
  expect(
    (await upstreamRequests()).some((item) => item.path === `/api/spaces/${personalId}/dashboard/consumptions`),
  ).toBe(true);
});

test('does not request finance aggregates when the finance module is disabled', async ({
  page,
  request,
  upstreamRequests,
}) => {
  expect((await request.post(`${mockApiOrigin}/__e2e/dashboard`, { data: { finances: false } })).status()).toBe(204);
  await page.goto(`/${sharedId}?year=2025&month=9`);
  await expect(
    page.getByRole('region', { name: 'Consumptions', exact: true }).getByText('18 kWh', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Limits', exact: true }).getByText('Monthly electricity', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('region', { name: 'Finances', exact: true })).toHaveCount(0);
  expect((await upstreamRequests()).filter((item) => /\/dashboard\/(finances|budgets)$/.test(item.path))).toEqual([]);
});

test('shows empty sections without demo values on a narrow screen', async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  expect((await request.post(`${mockApiOrigin}/__e2e/dashboard`, { data: { empty: true } })).status()).toBe(204);
  await page.goto(`/${sharedId}?year=2025&month=9`);
  await expect(page.getByText('No shared financial data for this year.', { exact: true })).toBeVisible();
  await expect(page.getByText('No consumption data for this year.', { exact: true })).toBeVisible();
  await expect(page.getByText('No monthly limits close to their threshold.', { exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: /January to December/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Next month', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test.describe('section failures', () => {
  test.use({ whitelistErrors: [[/503/, /Consumption unavailable/], { scope: 'test' }] });
  test('keeps successful sections usable during loading and recovers a failed section', async ({ page, request }) => {
    expect(
      (
        await request.post(`${mockApiOrigin}/__e2e/dashboard`, {
          data: { consumptionError: true, consumptionDelayMs: 1000 },
        })
      ).status(),
    ).toBe(204);
    await page.goto(`/${sharedId}?year=2025&month=9`);
    const consumptions = page.getByRole('region', { name: 'Consumptions', exact: true });
    await expect(consumptions.getByRole('status')).toHaveText('Loading…');
    await expect(
      page.getByRole('region', { name: 'Finances', exact: true }).getByText('1,008 EUR', { exact: true }),
    ).toBeVisible();
    await expect(consumptions.getByRole('alert')).toBeVisible({ timeout: 20_000 });
    await expect(consumptions.getByText('No consumption data for this year.')).toHaveCount(0);
    expect(
      (
        await request.post(`${mockApiOrigin}/__e2e/dashboard`, {
          data: { consumptionError: false, consumptionDelayMs: 0 },
        })
      ).status(),
    ).toBe(204);
    await consumptions.getByRole('button', { name: 'Try again', exact: true }).click();
    await expect(consumptions.getByText('18 kWh', { exact: true })).toBeVisible();
    await expect(consumptions.getByRole('alert')).toHaveCount(0);
  });
});

test('plots every recorded resource, grouped by unit, including resources without readings in the selected month', async ({
  page,
  request,
}) => {
  expect((await request.post(`${mockApiOrigin}/__e2e/dashboard`, { data: { multipleResources: true } })).status()).toBe(
    204,
  );
  await page.goto(`/${sharedId}?year=2025&month=9`);
  await page.setViewportSize({ width: 1440, height: 1100 });
  const section = page.getByRole('region', { name: 'Consumptions', exact: true });
  for (const name of ['Shared electricity', 'Solar energy', 'Water', 'Rainwater']) {
    await expect(section.getByRole('term').filter({ hasText: new RegExp(`^${name}$`) })).toHaveCount(1);
  }
  await expect(section.getByText('18 kWh', { exact: true })).toBeVisible();
  await expect(section.getByText('9 kWh', { exact: true })).toBeVisible();
  await expect(section.getByText('3 m³', { exact: true })).toBeVisible();
  await expect(section.getByText('No readings this month', { exact: true })).toBeVisible();
  const energy = section.getByRole('group', { name: 'Consumption history in kWh', exact: true });
  const water = section.getByRole('group', { name: 'Consumption history in m³', exact: true });
  await expect(energy.getByRole('img')).toHaveCount(1);
  await expect(water.getByRole('img')).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 1000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1100 });
  await energy.getByText('Monthly values · 2025', { exact: true }).click();
  await expect(energy.getByRole('columnheader', { name: 'Shared electricity (kWh)' })).toBeVisible();
  await expect(energy.getByRole('columnheader', { name: 'Solar energy (kWh)' })).toBeVisible();
  await water.getByText('Monthly values · 2025', { exact: true }).click();
  await expect(water.getByRole('columnheader', { name: 'Rainwater (m³)' })).toBeVisible();
  await expect(water.getByRole('columnheader', { name: 'Water (m³)', exact: true })).toBeVisible();
});

test('keeps section geometry stable as delayed consumption data replaces its skeleton', async ({ page, request }) => {
  expect(
    (
      await request.post(`${mockApiOrigin}/__e2e/dashboard`, {
        data: { consumptionDelayMs: 2500 },
      })
    ).status(),
  ).toBe(204);
  await page.goto(`/${sharedId}?year=2025&month=9`);
  const consumption = page.getByRole('region', { name: 'Consumptions', exact: true });
  await expect(consumption.getByRole('status')).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Finances', exact: true }).getByText('1,008 EUR', { exact: true }),
  ).toBeVisible();
  const geometry = () =>
    page.getByRole('region').evaluateAll((nodes) =>
      nodes.map((node) => ({
        name: node.getAttribute('aria-label'),
        top: (node as HTMLElement).offsetTop,
        height: node.getBoundingClientRect().height,
      })),
    );
  const before = await geometry();
  await page.evaluate(async () => {
    await document.fonts.ready;
    Reflect.set(window, 'dashboardLayoutShift', 0);
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
        if (!shift.hadRecentInput) {
          Reflect.set(
            window,
            'dashboardLayoutShift',
            Number(Reflect.get(window, 'dashboardLayoutShift')) + shift.value,
          );
        }
      }
    });
    observer.observe({ type: 'layout-shift' });
    Reflect.set(window, 'dashboardLayoutObserver', observer);
  });
  await expect(consumption.getByText('18 kWh', { exact: true })).toBeVisible();
  await expect(consumption.getByRole('img')).toHaveCount(1);
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  expect(await geometry()).toEqual(before);
  await page.getByRole('button', { name: 'Next month', exact: true }).click();
  await expect(
    page.getByRole('region', { name: 'Limits', exact: true }).getByText('100 %', { exact: true }),
  ).toBeVisible();
  expect(await geometry()).toEqual(before);
  expect(await page.evaluate(() => Number(Reflect.get(window, 'dashboardLayoutShift')))).toBeLessThan(0.01);
  await page.evaluate(() => (Reflect.get(window, 'dashboardLayoutObserver') as PerformanceObserver).disconnect());
});

test('shows only five critical consumption limits and budgets without inner scrolling', async ({ page, request }) => {
  expect(
    (
      await request.post(`${mockApiOrigin}/__e2e/dashboard`, {
        data: { manyThresholds: true, multipleResources: true },
      })
    ).status(),
  ).toBe(204);
  await page.goto(`/${sharedId}?year=2025&month=9`);
  const limits = page.getByRole('region', { name: 'Limits', exact: true });
  const budgets = page.getByRole('region', { name: 'Budgets', exact: true });
  await expect(limits.getByRole('article')).toHaveCount(5);
  await expect(budgets.getByRole('article')).toHaveCount(5);
  await expect(limits.getByRole('heading', { level: 3 })).toHaveText([
    'Consumption limit 130',
    'Consumption limit 120',
    'Consumption limit 110',
    'Consumption limit 100',
    'Consumption limit 90',
  ]);
  await expect(page.getByRole('region', { name: 'Finances', exact: true }).getByRole('img')).toHaveCount(0);
  const consumption = page.getByRole('region', { name: 'Consumptions', exact: true });
  await expect(consumption.getByRole('img')).toHaveCount(2);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const details of await consumption.locator('details').all()) {
      await details.locator('summary').click();
    }
    const scrollers = await page.getByRole('region').evaluateAll((regions) =>
      regions
        .flatMap((region) => [region, ...region.querySelectorAll('*')])
        .filter((element) => {
          const style = getComputedStyle(element);
          return /auto|scroll/.test(style.overflowY) && element.scrollHeight > element.clientHeight + 1;
        })
        .map((element) => element.className),
    );
    expect(scrollers).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
