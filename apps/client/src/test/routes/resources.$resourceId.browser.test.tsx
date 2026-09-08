import { expect, test, vi } from 'vitest';

import { Route as resourcesRoute } from '@/routes/_authenticated/_app/resources';
import { queryKeys } from '@/shared/api/query-keys';
import { renderRoute } from '@/test/render-route';

test('loads the canonical resource URL and closes to the overview while preserving search', async () => {
  const { router, screen } = await renderRoute({
    initialEntry: '/resources/resource-7?filter=active',
    overviewRoute: resourcesRoute,
    seedQueryClient(queryClient) {
      queryClient.setQueryData(queryKeys.resources.detail('resource-7'), {
        color: '#123456',
        creatorType: 'User',
        id: 'resource-7',
        name: 'Electricity',
        unit: 'kWh',
      });
    },
  });

  await expect.element(screen.getByRole('heading', { name: 'Update Electricity' })).toBeVisible();
  await expect.element(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Electricity');
  await screen.getByRole('button', { name: 'Close' }).click();

  await vi.waitFor(() => expect(router.state.location.pathname).toBe('/resources'));
  expect(router.state.location.search).toEqual({ filter: 'active' });
});
