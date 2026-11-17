import { queryKeys } from '@kijk/api/query-keys';
import { SpacePermissions } from '@kijk/api/spaces/permissions';
import type { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { expect, test } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';

import { Route as overviewRoute } from '@/routes/_authenticated/_app/$spaceId/consumptions/_overview/route';
import { listPage } from '@/test/list-page';
import { worker } from '@/test/mocks/browser';
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
  expect(
    queryClient.getQueryData(queryKeys.limits.list('space', { page: 1, pageSize: 10, search: '', sort: 'Resource' })),
  ).toMatchObject({ items: [expect.objectContaining({ id: 'limit' })] });
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
  client.setQueryData(
    queryKeys.limits.list('space', { page: 1, pageSize: 10, search: '', sort: 'Resource' }),
    listPage([
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
    ]),
  );
  client.setQueryData(queryKeys.resources.list('space'), listPage([]));
}

test('combines server search, period and paging and restores them from the URL', async () => {
  const requests: URLSearchParams[] = [];
  worker.use(
    http.get('http://localhost:5000/api/spaces/space/limits', ({ request }) => {
      const params = new URL(request.url).searchParams;
      requests.push(params);
      return HttpResponse.json({ items: [], page: Number(params.get('page') ?? 1), pageSize: 10, totalCount: 25 });
    }),
  );
  const { screen, router, cleanup } = await renderRoute({
    initialEntry: '/space/consumptions/limits?search=Energy&period=Month&page=2',
    overviewRoute,
    seedQueryClient,
  });
  await expect.element(screen.getByRole('searchbox', { name: 'Search limits' })).toHaveValue('Energy');
  await expect.poll(() => requests.at(-1)?.get('page')).toBe('2');
  expect(requests.at(-1)?.get('period')).toBe('Month');
  expect(requests.at(-1)?.get('search')).toBe('Energy');
  await screen.getByRole('button', { name: 'Next', exact: true }).click();
  await expect.poll(() => router.state.location.search.page).toBe(3);
  await screen.getByRole('searchbox', { name: 'Search limits' }).fill('Water');
  await userEvent.keyboard('{Enter}');
  await expect.poll(() => router.state.location.search).toEqual({ search: 'Water', period: 'Month' });
  const savedUrl = router.state.location.href;
  await cleanup();
  const reloaded = await renderRoute({ initialEntry: savedUrl, overviewRoute, seedQueryClient });
  await expect.element(reloaded.screen.getByRole('searchbox', { name: 'Search limits' })).toHaveValue('Water');
  expect(reloaded.router.state.location.search).toEqual({ search: 'Water', period: 'Month' });
});
