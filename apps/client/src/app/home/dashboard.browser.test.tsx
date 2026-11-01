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
    { resourceId: 'energy', name: 'Electricity', unit: 'kWh', month: 9, value: 0 },
  ]);
  client.setQueryData(queryKeys.dashboard.limits('space', 2026, 9), []);
  const change = vi.fn<(period: { year: number; month: number }) => void>();
  const screen = await render(
    <QueryClientProvider client={client}>
      <Dashboard spaceId='space' year={2026} month={9} onChange={change} />
    </QueryClientProvider>,
  );
  await expect.element(screen.getByText('0 kWh', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('No active limits.')).toBeVisible();
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
      <Dashboard spaceId='space' year={2026} month={9} onChange={() => undefined} />
    </QueryClientProvider>,
  );
  await expect.element(screen.getByRole('alert')).toBeVisible();
  await expect.element(screen.getByText('No active limits.')).toBeVisible();
  await screen.unmount();
  client.clear();
});
