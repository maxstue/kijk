import { expect, test } from './fixtures';
import { mockApiOrigin } from './mock-api/config';

const sharedId = '00000000-0000-4000-8000-000000000003';
const personalId = '00000000-0000-4000-8000-000000000005';

test.use({ storageState: 'playwright/.clerk/user.json' });

// Keep future-month visibility deterministic while navigating selected periods.
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2025-12-31T12:00:00Z'));
});

test('shows annual area series with selected month highlighting and limit boundary states', async ({
  page,
  upstreamRequests,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto(`/${sharedId}?year=2025&month=9`);
  const finances = page.getByRole('region', { name: 'Finances', exact: true });
  const consumptions = page.getByRole('region', { name: 'Consumptions', exact: true });
  const limits = page.getByRole('region', { name: 'Limits', exact: true });
  await expect(finances.getByText('1,008 EUR', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Space overview ·/ })).toHaveCount(0);
  expect((await page.getByRole('button', { name: 'Next month', exact: true }).boundingBox())!.x).toBeLessThan(700);
  await expect(consumptions.getByRole('img')).toBeVisible();
  await expect(consumptions.locator('linearGradient')).toHaveCount(1);
  await expect(consumptions.locator('linearGradient stop')).toHaveCount(2);
  await expect(consumptions.locator('path[fill*="url("]')).toHaveCount(1);
  const plotBox = await consumptions.getByRole('img').boundingBox();
  const sectionBox = await consumptions.boundingBox();
  expect(plotBox!.width).toBeGreaterThan(sectionBox!.width * 0.8);
  await expect(consumptions.getByRole('button', { name: 'Meter reading', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await consumptions.getByRole('button', { name: 'Consumption (diff)', exact: true }).click();
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
  await expect(consumptions.getByRole('figure', { name: 'Dec 2025 highlighted in kWh' })).toBeVisible();
  await page.getByRole('button', { name: 'Next month', exact: true }).click();
  await expect(page).toHaveURL(/year=2026/);
  await expect(page).toHaveURL(/month=1(?:&|$)/);
  await expect(page.getByRole('heading', { name: /^Space overview ·/ })).toHaveCount(0);
  await expect(consumptions.getByRole('figure', { name: 'Jan 2026 highlighted in kWh' })).toBeVisible();
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
  await expect(page.getByRole('heading', { name: /^Space overview ·/ })).toHaveCount(0);
  await expect(consumptions.getByRole('figure', { name: 'Jan 2026 highlighted in kWh' })).toBeVisible();
});

test('switches spaces without displaying the previous space data', async ({ page, upstreamRequests }) => {
  await page.goto(`/${sharedId}?year=2025&month=9`);
  await expect(
    page.getByRole('region', { name: 'Consumptions', exact: true }).getByText('Shared electricity', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'E2E Space', exact: true }).click();
  await page.getByRole('menuitem', { name: /Personal/ }).click();
  await expect(page).toHaveURL(new RegExp(`/${personalId}`));
  await expect(
    page.getByRole('region', { name: 'Consumptions', exact: true }).getByText('Personal electricity', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Consumptions', exact: true }).getByText('Shared electricity', { exact: true }),
  ).toHaveCount(0);
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
  await expect(page.getByRole('region', { name: 'Consumptions', exact: true }).getByRole('img')).toBeVisible();
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
  await expect(page.getByText('No shared budgets for this month.', { exact: true })).toBeVisible();
  for (const name of ['Limits', 'Budgets']) {
    expect((await page.getByRole('region', { name, exact: true }).boundingBox())!.height).toBeLessThan(250);
  }
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
    await expect(consumptions.getByRole('img')).toBeVisible();
    await expect(consumptions.getByRole('alert')).toHaveCount(0);
  });
});

test('selects each resource in a full-width chart using its own color and unit without fetching again', async ({
  page,
  request,
  upstreamRequests,
}) => {
  expect((await request.post(`${mockApiOrigin}/__e2e/dashboard`, { data: { multipleResources: true } })).status()).toBe(
    204,
  );
  await page.goto(`/${sharedId}?year=2025&month=9`);
  const section = page.getByRole('region', { name: 'Consumptions', exact: true });
  await section.getByRole('button', { name: 'Meter reading', exact: true }).click();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1100 });
    for (const [name, unit, color] of [
      ['Shared electricity', 'kWh', '#2563eb'],
      ['Solar energy', 'kWh', '#16a34a'],
      ['Water', 'm³', '#06b6d4'],
      ['Rainwater', 'm³', '#8b5cf6'],
    ]) {
      await section.getByRole('combobox', { name: 'Resource', exact: true }).click();
      await page.getByRole('option', { name: `${name} (${unit})`, exact: true }).click();
      await expect(section.getByRole('img')).toHaveCount(1);
      const chart = section.getByRole('img', { name: `January to December 2025, ${unit}` });
      await expect(chart).toBeVisible();
      await expect(section.getByRole('columnheader', { name: `${name} (${unit})`, exact: true })).toHaveCount(1);
      await expect(section.getByRole('button', { name: 'Meter reading', exact: true })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      if (name !== 'Rainwater') {
        await expect(chart.locator(`path[stroke="${color}"]`)).toHaveCount(1);
        await expect(chart.locator(`linearGradient stop[stop-color="${color}"]`)).toHaveCount(2);
      }
      const plot = (await chart.boundingBox())!;
      const bounds = (await section.boundingBox())!;
      expect(plot.width).toBeGreaterThan(bounds.width * 0.8);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  }
  const calls = (await upstreamRequests()).filter((item) => item.path.endsWith('/dashboard/consumptions'));
  expect(calls).toHaveLength(1);
  await section.getByRole('button', { name: 'Consumption (diff)', exact: true }).click();
  await expect(section.getByRole('cell', { name: '7', exact: true })).toHaveCount(1);
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
    Reflect.set(window, 'dashboardShiftSources', []);
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
        if (!shift.hadRecentInput) {
          const sources = (
            entry as PerformanceEntry & {
              sources: Array<{ node?: Element; previousRect: DOMRectReadOnly; currentRect: DOMRectReadOnly }>;
            }
          ).sources;
          (Reflect.get(window, 'dashboardShiftSources') as unknown[]).push(
            sources.map((source) => ({
              tag: source.node?.tagName,
              slot: source.node?.getAttribute('data-slot'),
              before: source.previousRect.toJSON(),
              after: source.currentRect.toJSON(),
            })),
          );
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
  await expect(consumption.getByRole('figure')).toBeVisible();
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
  expect(
    await page.evaluate(() => Number(Reflect.get(window, 'dashboardLayoutShift'))),
    JSON.stringify(await page.evaluate(() => Reflect.get(window, 'dashboardShiftSources'))),
  ).toBeLessThan(0.01);
  await page.evaluate(() => (Reflect.get(window, 'dashboardLayoutObserver') as PerformanceObserver).disconnect());
});

test('shows only three ranked consumption limits and budgets without inner scrolling', async ({ page, request }) => {
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
  await expect(limits.getByRole('article')).toHaveCount(3);
  await expect(budgets.getByRole('article')).toHaveCount(3);
  await expect(limits.getByRole('heading', { level: 3 })).toHaveText([
    'Consumption limit 130',
    'Consumption limit 120',
    'Consumption limit 110',
  ]);
  await expect(page.getByRole('region', { name: 'Finances', exact: true }).getByRole('img')).toHaveCount(0);
  const consumption = page.getByRole('region', { name: 'Consumptions', exact: true });
  await expect(consumption.getByRole('img')).toHaveCount(1);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
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

test('keeps month navigation free of skeleton flashes and aligns the lower cards', async ({ page, request }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(`/${sharedId}?year=2025&month=9`);
  const limits = page.getByRole('region', { name: 'Limits', exact: true });
  const budgets = page.getByRole('region', { name: 'Budgets', exact: true });
  const consumption = page.getByRole('region', { name: 'Consumptions', exact: true });
  await expect(limits.getByRole('article')).toHaveCount(2);
  await expect(budgets.getByRole('article')).toHaveCount(3);
  await expect(budgets.getByRole('heading', { level: 3 })).toHaveText([
    'Household budget 70',
    'Household budget 60',
    'Household budget 50',
  ]);
  const limitBox = (await limits.boundingBox())!;
  const budgetBox = (await budgets.boundingBox())!;
  expect(limitBox.y).toBe(budgetBox.y);
  expect(limitBox.height).toBe(budgetBox.height);
  expect(limitBox.height).toBeLessThan(520);
  expect(Math.abs(limitBox.width - budgetBox.width)).toBeLessThan(1);
  const chartBox = (await consumption.boundingBox())!;
  expect(chartBox.y + chartBox.height).toBeLessThan(limitBox.y);
  const band = consumption.locator('[stroke-width="28"]');
  const before = await band.boundingBox();
  expect((await request.post(`${mockApiOrigin}/__e2e/dashboard`, { data: { periodDelayMs: 1500 } })).status()).toBe(
    204,
  );
  await page.evaluate(() => {
    Reflect.set(window, 'skeletonFlashes', 0);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (
            node instanceof Element &&
            (node.matches('[data-slot="skeleton"]') || node.querySelector('[data-slot="skeleton"]'))
          ) {
            Reflect.set(window, 'skeletonFlashes', Number(Reflect.get(window, 'skeletonFlashes')) + 1);
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    Reflect.set(window, 'skeletonObserver', observer);
  });
  await page.getByRole('button', { name: 'Next month', exact: true }).click();
  await expect(limits).toHaveAttribute('aria-busy', 'true');
  await expect(limits.getByText('90 %', { exact: true })).toBeVisible();
  await expect(consumption.getByRole('figure', { name: 'Oct 2025 highlighted in kWh' })).toBeVisible();
  expect((await band.boundingBox())!.x).toBeGreaterThan(before!.x);
  await expect(limits.getByText('100 %', { exact: true })).toBeVisible();
  await expect(limits).toHaveAttribute('aria-busy', 'false');
  await page.getByRole('button', { name: 'Next month', exact: true }).click();
  await expect(limits.getByText('110 %', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Next month', exact: true }).click();
  await expect(limits.getByText('120 %', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => Number(Reflect.get(window, 'skeletonFlashes')))).toBe(0);
  await page.evaluate(() => (Reflect.get(window, 'skeletonObserver') as MutationObserver).disconnect());
});

test('switches between meter readings and monthly consumption without fetching again', async ({
  page,
  upstreamRequests,
}) => {
  await page.goto(`/${sharedId}?year=2025&month=9`);
  const section = page.getByRole('region', { name: 'Consumptions', exact: true });
  await expect(section.getByRole('img', { name: 'January to December 2025, kWh' })).toBeVisible();
  const september = section.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'Sep', exact: true }) });
  const january = section.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'Jan', exact: true }) });
  await expect(section.getByRole('button', { name: 'Meter reading', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(september.getByRole('cell')).toHaveText('1,080');
  await expect(january.getByRole('cell')).toHaveText('1,000');
  await expect(section.getByRole('status')).toHaveCount(0);
  await section.getByRole('button', { name: 'Consumption (diff)', exact: true }).click();
  await expect(september.getByRole('cell')).toHaveText('18');
  await expect(january.getByRole('cell')).toHaveText('0');
  const requests = (await upstreamRequests()).filter((item) => item.path.endsWith('/dashboard/consumptions'));
  expect(requests).toHaveLength(1);
  expect(new URLSearchParams(requests[0]!.search).get('year')).toBe('2025');
  await page.setViewportSize({ width: 390, height: 844 });
  const difference = section.getByRole('button', { name: 'Consumption (diff)', exact: true });
  await difference.click();
  await expect(september.getByRole('cell')).toHaveText('18');
  const bounds = (await section.boundingBox())!;
  for (const name of ['Meter reading', 'Consumption (diff)']) {
    const control = (await section.getByRole('button', { name, exact: true }).boundingBox())!;
    expect(control.x).toBeGreaterThanOrEqual(bounds.x + 16);
    expect(control.x + control.width).toBeLessThanOrEqual(bounds.x + bounds.width - 16);
  }
});

test('keeps January through December visible when readings exist only from August through October', async ({
  page,
  request,
}) => {
  expect((await request.post(`${mockApiOrigin}/__e2e/dashboard`, { data: { sparseReadings: true } })).status()).toBe(
    204,
  );
  await page.goto(`/${sharedId}?year=2025&month=11`);
  const section = page.getByRole('region', { name: 'Consumptions', exact: true });
  const chart = section.getByRole('img', { name: 'January to December 2025, kWh' });
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const name of ['Consumption (diff)', 'Meter reading']) {
      await section.getByRole('button', { name, exact: true }).click();
      for (const month of months) {
        await expect(chart.getByText(month, { exact: true })).toBeVisible();
      }
      const first = (await chart.getByText('Jan', { exact: true }).boundingBox())!;
      const august = (await chart.getByText('Aug', { exact: true }).boundingBox())!;
      const last = (await chart.getByText('Dec', { exact: true }).boundingBox())!;
      expect(august.x - first.x).toBeGreaterThan((last.x - first.x) * 0.6);
    }
  }
  const january = section.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'Jan', exact: true }) });
  await expect(january.getByRole('cell')).toHaveText('No data');
});

test('never displays another year while loading an empty selected year', async ({
  page,
  request,
  upstreamRequests,
}) => {
  expect(
    (await request.post(`${mockApiOrigin}/__e2e/dashboard`, { data: { emptyConsumptionYears: [2024] } })).status(),
  ).toBe(204);
  await page.goto(`/${sharedId}?year=2025&month=1`);
  const section = page.getByRole('region', { name: 'Consumptions', exact: true });
  await expect(section.getByRole('img', { name: 'January to December 2025, kWh' })).toBeVisible();
  expect((await request.post(`${mockApiOrigin}/__e2e/dashboard`, { data: { periodDelayMs: 1000 } })).status()).toBe(
    204,
  );
  await page.getByRole('button', { name: 'Previous month', exact: true }).click();
  await expect(page).toHaveURL(/year=2024/);
  await expect(section.getByRole('img', { name: 'January to December 2025, kWh' })).toHaveCount(0);
  await expect(section.getByText('No consumption data for this year.', { exact: true })).toBeVisible();
  await expect(section.getByRole('img')).toHaveCount(0);
  await expect(section.getByRole('combobox', { name: 'Resource', exact: true })).toBeDisabled();
  await expect(section.getByText(/January–December 2024/)).toBeVisible();
  await page.getByRole('button', { name: 'Next month', exact: true }).click();
  await expect(section.getByRole('img', { name: 'January to December 2025, kWh' })).toBeVisible();
  expect(
    (await upstreamRequests()).some(
      (item) =>
        item.path.endsWith('/dashboard/consumptions') && new URLSearchParams(item.search).get('year') === '2024',
    ),
  ).toBe(true);
});

test('stores resource and view in the URL and restores all filters on reload and history navigation', async ({
  page,
  request,
}) => {
  expect((await request.post(`${mockApiOrigin}/__e2e/dashboard`, { data: { multipleResources: true } })).status()).toBe(
    204,
  );
  await page.goto(`/${sharedId}?year=2025&month=9&resource=water&view=consumption`);
  const section = page.getByRole('region', { name: 'Consumptions', exact: true });
  const resource = section.getByRole('combobox', { name: 'Resource', exact: true });
  await expect(resource).toContainText('Water (m³)');
  await expect(section.getByRole('button', { name: 'Consumption (diff)', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await resource.click();
  await page.getByRole('option', { name: 'Solar energy (kWh)', exact: true }).click();
  await expect(page).toHaveURL(/resource=solar/);
  await expect(page).toHaveURL(/view=consumption/);
  await section.getByRole('button', { name: 'Meter reading', exact: true }).click();
  await expect(page).toHaveURL(/view=meter/);
  await page.getByRole('button', { name: 'Next month', exact: true }).click();
  await expect(page).toHaveURL(/month=10/);
  await expect(page).toHaveURL(/resource=solar/);
  await expect(page).toHaveURL(/view=meter/);
  await page.reload();
  await expect(resource).toContainText('Solar energy (kWh)');
  await expect(section.getByRole('button', { name: 'Meter reading', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(section.getByRole('figure', { name: 'Oct 2025 highlighted in kWh' })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/month=9/);
  await page.goBack();
  await expect(section.getByRole('button', { name: 'Consumption (diff)', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.goBack();
  await expect(resource).toContainText('Water (m³)');
  await expect(section.getByRole('img', { name: 'January to December 2025, m³' })).toBeVisible();
});
