import { queryKeys } from '@kijk/api/query-keys';
import type { QueryClient } from '@tanstack/react-query';
import { expect, test } from 'vite-plus/test';

import { Route as appRoute } from '@/routes/_authenticated/_app/route';
import { listPage } from '@/test/list-page';
import { renderRoute } from '@/test/render-route';

test('restores the resource filter and expanded readings from URL and history', async () => {
  const { router, screen, cleanup } = await renderRoute({
    initialEntry: '/space/consumptions?view=year&year=2026&resourceId=water&expanded=["water"]',
    overviewRoute: appRoute,
    seedQueryClient,
  });
  await expect
    .element(screen.getByRole('combobox', { name: 'Filter consumptions by type' }))
    .toHaveTextContent('Water');
  await expect.element(screen.getByRole('button', { name: 'Collapse entries' })).toBeVisible();
  await expect.element(screen.getByRole('cell', { name: 'Water reading', exact: true })).toBeVisible();
  await screen.getByRole('button', { name: 'Collapse entries' }).click();
  await expect.poll(() => router.state.location.search.expanded).toEqual([]);
  router.history.back();
  await expect.element(screen.getByRole('button', { name: 'Collapse entries' })).toBeVisible();
  await screen.getByRole('combobox', { name: 'Filter consumptions by type' }).click();
  await screen.getByRole('option', { name: 'All types' }).click();
  await expect.poll(() => screen.getByRole('button', { name: 'Expand entries' }).all().length).toBe(1);
  await expect.element(screen.getByRole('button', { name: 'Collapse entries' })).toBeVisible();
  const url = router.state.location.href;
  await cleanup();
  const restored = await renderRoute({ initialEntry: url, overviewRoute: appRoute, seedQueryClient });
  await expect
    .element(restored.screen.getByRole('combobox', { name: 'Filter consumptions by type' }))
    .toHaveTextContent('All types');
  await expect.element(restored.screen.getByRole('button', { name: 'Collapse entries' })).toBeVisible();
  expect(restored.router.state.location.search.expanded).toEqual(['water']);
});

function seedQueryClient(client: QueryClient) {
  client.setQueryData(
    queryKeys.consumptions.by('space', '2026'),
    ['water', 'electricity'].map((id) => ({
      id,
      name: id === 'water' ? 'Water reading' : 'Electricity reading',
      date: '2026-01-01',
      value: 10,
      calculatedConsumption: 10,
      startsNewMeterSegment: false,
      resource: { id, name: id === 'water' ? 'Water' : 'Electricity', unit: 'kWh', icon: 'zap', color: '#123456' },
    })),
  );
  client.setQueryData(queryKeys.consumptions.years('space'), { years: [2026] });
  client.setQueryData(queryKeys.limits.list('space'), listPage([]));
}
