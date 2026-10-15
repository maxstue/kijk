import { queryKeys } from '@kijk/api/query-keys';
import { http, HttpResponse } from 'msw';
import { expect, test, vi } from 'vite-plus/test';

import { Route as appRoute } from '@/routes/_authenticated/_app/route';
import { Route as authenticatedRoute } from '@/routes/_authenticated/route';
import { routeTree } from '@/routeTree.gen';
import { worker } from '@/test/mocks/browser';
import { renderRoute } from '@/test/render-route';

import { Route } from './route';

test('restores layouts, guards and the loader when the router fixture is cleaned up', async () => {
  const routes = [routeTree, authenticatedRoute, appRoute, Route];
  const originals = routes.map((route) => ({ ...route.options }));
  const { cleanup, queryClient } = await renderRoute({
    initialEntry: '/consumptions?view=year&year=2026',
    overviewRoute: Route,
    seedQueryClient(client) {
      client.setQueryData(queryKeys.limits.list(), []);
    },
  });
  expect(authenticatedRoute.options.beforeLoad).toBeUndefined();
  expect(Route.options.loader).toBeUndefined();
  await cleanup();
  for (const [index, route] of routes.entries()) {
    expect(route.options).toEqual(originals[index]);
  }
  expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
});

test('runs the real loader with validated search and waits for the requested data', async () => {
  const pending = Promise.withResolvers<void>();
  const requests: URL[] = [];
  worker.use(
    http.get('http://localhost:5000/api/consumptions', async ({ request }) => {
      requests.push(new URL(request.url));
      await pending.promise;
      return HttpResponse.json([]);
    }),
  );
  const { router, queryClient } = await renderRoute({
    initialEntry: '/consumptions?view=month&year=2026&month=september',
    overviewRoute: Route,
    stubOverviewLoader: false,
    seedQueryClient() {},
  });
  await vi.waitFor(() => expect(requests).toHaveLength(2));
  expect(router.state.isLoading).toBe(true);
  expect(requests.map((url) => url.searchParams.get('month'))).toEqual(expect.arrayContaining([null, 'september']));
  expect(requests.every((url) => url.searchParams.get('year') === '2026')).toBe(true);
  pending.resolve();
  await vi.waitFor(() => expect(router.state.isLoading).toBe(false));
  expect(queryClient.getQueryData(queryKeys.consumptions.by('2026', 'september'))).toEqual([]);
  expect(queryClient.getQueryData(queryKeys.consumptions.by('2026'))).toEqual([]);
  expect(router.state.matches.find((match) => match.routeId === Route.id)?.status).toBe('success');
});

test('reports a real loader failure instead of entering the route successfully', async () => {
  worker.use(
    http.get('http://localhost:5000/api/consumptions', () =>
      HttpResponse.json({ title: 'Unavailable' }, { status: 503 }),
    ),
  );
  const { router } = await renderRoute({
    initialEntry: '/consumptions?view=year&year=2026',
    overviewRoute: Route,
    stubOverviewLoader: false,
    seedQueryClient() {},
  });
  await vi.waitFor(() =>
    expect(router.state.matches.find((match) => match.routeId === Route.id)?.status).toBe('error'),
  );
});
