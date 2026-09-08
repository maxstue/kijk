import { expect, test, vi } from 'vitest';

import { Route as consumptionsRoute } from '@/routes/_authenticated/_app/consumptions';
import { queryKeys } from '@/shared/api/query-keys';
import { renderRoute } from '@/test/render-route';

test('loads the canonical consumption URL and closes to the overview while preserving search', async () => {
  const resource = { color: '#123456', creatorType: 'User', id: 'resource-7', name: 'Electricity', unit: 'kWh' };
  const { router, screen } = await renderRoute({
    initialEntry: '/consumptions/consumption-42?view=month&year=2026&month=september',
    overviewRoute: consumptionsRoute,
    seedQueryClient(queryClient) {
      queryClient.setQueryData(queryKeys.consumptions.detail('consumption-42'), {
        date: '2026-09-08',
        id: 'consumption-42',
        name: 'Office electricity',
        resource,
        value: 42,
      });
      queryClient.setQueryData(queryKeys.resources.list(), [resource]);
      queryClient.setQueryData(queryKeys.consumptionLimits.list(), []);
    },
  });

  await expect.element(screen.getByRole('heading', { name: 'Update Consumption' })).toBeVisible();
  await expect.element(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Office electricity');
  await screen.getByRole('button', { name: 'Close' }).click();

  await vi.waitFor(() => expect(router.state.location.pathname).toBe('/consumptions'));
  expect(router.state.location.search).toEqual({ month: 'september', view: 'month', year: 2026 });
});
