import { queryKeys } from '@kijk/api/query-keys';
import { expect, test, vi } from 'vite-plus/test';

import { Route as resourcesRoute } from '@/routes/_authenticated/_app/$spaceId/consumptions/resources/route';
import { renderRoute } from '@/test/render-route';

test('loads the canonical resource URL and closes to the overview while preserving search', async () => {
  const { router, screen } = await renderRoute({
    initialEntry: '/consumptions/resources/resource-7?filter=active',
    overviewRoute: resourcesRoute,
    seedQueryClient(queryClient) {
      queryClient.setQueryData(queryKeys.resources.detail('resource-7'), {
        color: '#123456',
        creatorType: 'User',
        id: 'resource-7',
        name: 'Electricity',
        unit: 'kWh',
      });
      queryClient.setQueryData(queryKeys.units.list({ scope: 'Space' }), {
        customCount: 0,
        items: [],
        page: 1,
        pageSize: 1,
        totalCount: 0,
      });
    },
  });

  await expect.element(screen.getByRole('heading', { name: 'Update Electricity' })).toBeVisible();
  await expect.element(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Electricity');
  await screen.getByRole('button', { name: 'Close' }).click();

  await vi.waitFor(() => expect(router.state.location.pathname).toBe('/consumptions/resources'));
  expect(router.state.location.search).toEqual({ filter: 'active' });
});
