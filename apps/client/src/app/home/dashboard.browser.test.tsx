import { queryKeys } from '@kijk/api/query-keys';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, test, vi } from 'vite-plus/test';

import { render } from '@/test/render-space';

import { Dashboard } from './dashboard';

test('disabled finances stay unmounted while consumption zero and empty limits remain distinct', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  client.setQueryData(queryKeys.users.me, { user: { spaces: [{ id: 'space', role: { permissions: [] } }] } });
  client.setQueryData(queryKeys.users.features, { finances: false });
  client.setQueryData(queryKeys.dashboard.consumptions('space', 2026), [
    { resourceId: 'energy', name: 'Electricity', unit: 'kWh', month: 9, value: 0, meterReading: 0 },
  ]);
  client.setQueryData(queryKeys.dashboard.limits('space', 2026, 9), []);
  const change = vi.fn<(period: { year: number; month: number }) => void>();
  const screen = await render(
    <QueryClientProvider client={client}>
      <Dashboard
        view='meter'
        onResourceChange={() => undefined}
        onViewChange={() => undefined}
        spaceId='space'
        year={2026}
        month={9}
        onChange={change}
      />
    </QueryClientProvider>,
  );
  await expect.element(screen.getByRole('figure', { name: 'Sep 2026 highlighted in kWh' })).toBeVisible();
  await expect.element(screen.getByRole('cell', { name: '0', exact: true })).toBeInTheDocument();
  await expect.element(screen.getByText('No monthly limits close to their threshold.')).toBeVisible();
  expect(client.getQueryState(queryKeys.dashboard.finances('space', 2026))).toBeUndefined();
  await screen.getByRole('button', { name: 'Previous month' }).click();
  expect(change).toHaveBeenCalledWith({ year: 2026, month: 8 });
  await screen.unmount();
  client.clear();
});

test('a failed section leaves other sections usable and does not appear empty', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  client.setQueryData(queryKeys.users.me, { user: { spaces: [{ id: 'space', role: { permissions: [] } }] } });
  client.setQueryData(queryKeys.users.features, { finances: false });
  client.setQueryData(queryKeys.dashboard.limits('space', 2026, 9), []);
  await client
    .fetchQuery({
      queryKey: queryKeys.dashboard.consumptions('space', 2026),
      queryFn: () => Promise.reject(new Error('Unavailable')),
    })
    .catch(() => undefined);
  const screen = await render(
    <QueryClientProvider client={client}>
      <Dashboard
        view='meter'
        onResourceChange={() => undefined}
        onViewChange={() => undefined}
        spaceId='space'
        year={2026}
        month={9}
        onChange={() => undefined}
      />
    </QueryClientProvider>,
  );
  await expect.element(screen.getByRole('alert')).toBeVisible();
  await expect.element(screen.getByText('No monthly limits close to their threshold.')).toBeVisible();
  await screen.unmount();
  client.clear();
});

test('shows only the three most urgent monthly limits, excluding safe and quarterly limits', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  client.setQueryData(queryKeys.users.me, { user: { spaces: [{ id: 'space', role: { permissions: [] } }] } });
  client.setQueryData(queryKeys.users.features, { finances: false });
  client.setQueryData(queryKeys.dashboard.consumptions('space', 2025), []);
  const period = { periodStart: '2025-09-01T00:00:00Z', periodEnd: '2025-10-01T00:00:00Z' };
  const limits = [70, 80, 90, 100, 110, 120].map((percentage) => ({
    id: String(percentage),
    name: `Usage ${percentage}`,
    threshold: 100,
    actualValue: percentage,
    percentage,
    remaining: Math.max(0, 100 - percentage),
    overrun: Math.max(0, percentage - 100),
    unit: 'kWh',
    ...period,
  }));
  client.setQueryData(queryKeys.dashboard.limits('space', 2025, 9), [
    ...limits,
    {
      id: 'zero',
      name: 'Zero allowance',
      threshold: 0,
      actualValue: 5,
      percentage: null,
      remaining: 0,
      overrun: 5,
      unit: 'kWh',
      ...period,
    },
    { ...limits[0], id: 'quarter', name: 'Quarterly', percentage: 999, periodStart: '2025-07-01T00:00:00Z' },
  ]);
  const screen = await render(
    <QueryClientProvider client={client}>
      <Dashboard
        view='meter'
        onResourceChange={() => undefined}
        onViewChange={() => undefined}
        spaceId='space'
        year={2025}
        month={9}
        onChange={() => undefined}
      />
    </QueryClientProvider>,
  );
  for (const name of ['Zero allowance', 'Usage 120', 'Usage 110']) {
    await expect.element(screen.getByText(name, { exact: true })).toBeVisible();
  }
  for (const name of ['Usage 100', 'Usage 90', 'Usage 80', 'Usage 70', 'Quarterly']) {
    await expect.element(screen.getByText(name, { exact: true })).not.toBeInTheDocument();
  }
  await screen.unmount();
  client.clear();
});
