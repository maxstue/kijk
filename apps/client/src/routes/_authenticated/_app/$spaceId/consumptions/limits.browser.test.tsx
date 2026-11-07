import { queryKeys } from '@kijk/api/query-keys';
import { SpacePermissions } from '@kijk/api/spaces/permissions';
import type { QueryClient } from '@tanstack/react-query';
import { expect, test } from 'vite-plus/test';

import { Route as overviewRoute } from '@/routes/_authenticated/_app/$spaceId/consumptions/_overview/route';
import { renderRoute } from '@/test/render-route';

test('defaults to the list and restores the chosen view through navigation and reload', async () => {
  const { router, screen, queryClient, cleanup } = await renderRoute({
    initialEntry: '/space/consumptions/limits',
    overviewRoute,
    seedQueryClient,
  });

  await expect.element(screen.getByRole('table', { name: 'Consumption limits' })).toBeVisible();
  await screen.getByRole('button', { name: 'Card view' }).click();
  await expect.element(screen.getByRole('list', { name: 'Consumption limits' })).toBeVisible();
  expect(router.state.location.search).toMatchObject({ view: 'cards' });
  await router.invalidate();
  await expect.element(screen.getByRole('button', { name: 'Card view' })).toHaveAttribute('aria-pressed', 'true');
  router.history.back();
  await expect.element(screen.getByRole('table', { name: 'Consumption limits' })).toBeVisible();
  router.history.forward();
  await expect.element(screen.getByRole('list', { name: 'Consumption limits' })).toBeVisible();
  expect(queryClient.getQueryData(queryKeys.limits.list('space'))).toHaveLength(1);
  const savedUrl = router.state.location.href;
  await cleanup();
  const reloaded = await renderRoute({ initialEntry: savedUrl, overviewRoute, seedQueryClient });
  await expect.element(reloaded.screen.getByRole('list', { name: 'Consumption limits' })).toBeVisible();
});

function seedQueryClient(client: QueryClient) {
  client.setQueryData(queryKeys.users.me, {
    status: 'Ready',
    user: {
      id: 'user',
      spaces: [{ id: 'space', isPersonal: true, role: { permissions: [SpacePermissions.limits.view] } }],
    },
  });
  client.setQueryData(queryKeys.limits.list('space'), [
    {
      id: 'limit',
      name: 'Monthly electricity',
      period: 'Month',
      active: true,
      isExceeded: false,
      resource: { name: 'Electricity', unit: 'kWh' },
      actualValue: 20,
      limit: 100,
      utilizationPercentage: 20,
      remainingValue: 80,
      history: [],
    },
  ]);
  client.setQueryData(queryKeys.resources.list('space'), []);
}
