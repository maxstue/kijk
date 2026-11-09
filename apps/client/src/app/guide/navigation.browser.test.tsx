import { queryKeys } from '@kijk/api/query-keys';
import type { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { expect, test, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';

import { Route as appRoute } from '@/routes/_authenticated/_app/route';
import { worker } from '@/test/mocks/browser';
import { renderRoute } from '@/test/render-route';

const resource = {
  id: 'electricity',
  name: 'Electricity',
  color: '#123456',
  icon: 'zap',
  unitId: 'unit',
  unit: 'kWh',
  unitName: 'Kilowatt-hours',
  quantityKey: 'Energy',
  creatorType: 'System',
};

function seed(client: QueryClient, resources = [resource]) {
  client.setQueryData(queryKeys.users.me, {
    status: 'Ready',
    user: {
      id: 'user',
      spaces: ['space', 'other'].map((id) => ({
        id,
        name: id,
        role: {
          permissions: [
            'consumptions:view',
            'consumptions:record',
            'resources:view',
            'resources:configure',
            'limits:plan',
            'limits:view',
          ],
        },
      })),
    },
  });
  client.setQueryData(queryKeys.users.features, { finances: false });
  client.setQueryData(queryKeys.users.guide, {
    guideHidden: false,
    guideDashboardVersion: 0,
    guideFirstConsumptionAt: null,
  });
  client.setQueryData(queryKeys.resources.list('space'), resources);
  client.setQueryData(queryKeys.consumptions.years('space'), { years: [] });
  client.setQueryData(queryKeys.limits.list('space'), []);
  client.setQueryData(queryKeys.dashboard.consumptions('space', 2026), []);
  client.setQueryData(queryKeys.dashboard.limits('space', 2026, 11), []);
  worker.use(
    http.get('http://localhost:5000/api/spaces/space/consumptions', () => HttpResponse.json([])),
    http.get('http://localhost:5000/api/spaces/space/consumptions/statistics', () => HttpResponse.json({ stats: [] })),
  );
}

test('the checklist opens the real recording dialog and cancelling it never submits data', async () => {
  const write = vi.fn<() => void>();
  worker.use(
    http.post('http://localhost:5000/api/spaces/space/consumptions', () => {
      write();
      return HttpResponse.json({});
    }),
  );
  const { screen, router } = await renderRoute({
    initialEntry: '/space?year=2026&month=11',
    overviewRoute: appRoute,
    seedQueryClient: seed,
  });
  await screen.getByRole('button', { name: 'Record a value' }).click();
  await expect.element(page.getByRole('dialog', { name: 'Add Consumption' })).toBeVisible();
  expect(router.state.location.pathname).toBe('/space/consumptions');
  expect(router.state.location.search).toMatchObject({ create: true });
  await userEvent.keyboard('{Escape}');
  await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
  expect(router.state.location.search.create).toBeUndefined();
  expect(write).not.toHaveBeenCalled();
});

test('without resources the direct action leads through configuration and returns to the real form', async () => {
  const { screen, router, queryClient } = await renderRoute({
    initialEntry: '/space?year=2026&month=11',
    overviewRoute: appRoute,
    seedQueryClient: (client) => seed(client, []),
  });
  await screen.getByRole('button', { name: 'Record a value' }).click();
  await expect.element(screen.getByText('Configure a resource to continue your checklist.')).toBeVisible();
  expect(router.state.location.search).toMatchObject({ guideReturn: 'record' });
  expect(screen.getByRole('link', { name: 'Continue to record a value' }).query()).toBeNull();
  queryClient.setQueryData(queryKeys.resources.list('space'), [resource]);
  await screen.getByRole('link', { name: 'Continue to record a value' }).click();
  await expect.element(page.getByRole('dialog', { name: 'Add Consumption' })).toBeVisible();
  expect(router.state.location.pathname).toBe('/space/consumptions');
  await userEvent.keyboard('{Escape}');
});

test('help restores the checklist, consumes its URL request, and back navigation does not repeat it', async () => {
  const write = vi.fn<(body: unknown) => void>();
  worker.use(
    http.patch('http://localhost:5000/api/users/me/guide', async ({ request }) => {
      write(await request.json());
      return HttpResponse.json({ guideHidden: false, guideDashboardVersion: 0, guideFirstConsumptionAt: null });
    }),
    http.get('http://localhost:5000/api/users/me/guide', () =>
      HttpResponse.json({ guideHidden: false, guideDashboardVersion: 0, guideFirstConsumptionAt: null }),
    ),
  );
  const { screen, router } = await renderRoute({
    initialEntry: '/settings/help',
    overviewRoute: appRoute,
    seedQueryClient: seed,
  });
  await screen.getByRole('button', { name: 'Show checklist on dashboard' }).click();
  await expect.element(page.getByRole('dialog', { name: 'First steps with Kijk' })).toBeVisible();
  expect(router.state.location.search.introduction).toBeUndefined();
  await userEvent.keyboard('{Escape}');
  await router.navigate({ to: '/settings/$section', params: { section: 'help' } });
  router.history.back();
  await expect.element(screen.getByRole('button', { name: 'Show checklist' })).toBeVisible();
  expect(document.querySelector('.driver-popover')).toBeNull();
  expect(write).toHaveBeenCalledTimes(1);
});
