import { queryKeys } from '@kijk/api/query-keys';
import type { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { expect, test } from 'vite-plus/test';

import { Route as appRoute } from '@/routes/_authenticated/_app/route';
import { listPage } from '@/test/list-page';
import { worker } from '@/test/mocks/browser';
import { renderRoute } from '@/test/render-route';

test('categories restores search, sort and page through URL, history and reload', async () => {
  const path = 'finances/categories';
  const endpoint = 'categories';
  const placeholder = 'Search name...';
  const requests: URLSearchParams[] = [];
  worker.use(
    http.get(`http://localhost:5000/api/spaces/space/${endpoint}`, ({ request }) => {
      const query = new URL(request.url).searchParams;
      requests.push(query);
      return HttpResponse.json({ items: [], page: Number(query.get('page') ?? 1), pageSize: 10, totalCount: 35 });
    }),
    http.get('http://localhost:5000/api/spaces/space/category-rules', () =>
      HttpResponse.json({ items: [], page: 1, totalCount: 0 }),
    ),
  );
  const { router, screen, cleanup } = await renderRoute({
    initialEntry: `/space/${path}?page=2&search=fuel&sort=name&descending=true`,
    overviewRoute: appRoute,
    seedQueryClient,
  });
  await expect.element(screen.getByRole('searchbox', { name: placeholder })).toHaveValue('fuel');
  expect(requests.at(-1)?.get('page')).toBe('2');
  expect(requests.at(-1)?.get('sort')).toBe('Name');
  expect(requests.at(-1)?.get('descending')).toBe('true');
  await screen.getByRole('button', { name: 'Next', exact: true }).click();
  await expect.poll(() => router.state.location.search.page).toBe(3);
  router.history.back();
  await expect.poll(() => router.state.location.search.page).toBe(2);
  router.history.forward();
  await expect.poll(() => router.state.location.search.page).toBe(3);
  await screen.getByRole('button', { name: 'Name', exact: true }).click();
  await expect.poll(() => router.state.location.search).toEqual({ search: 'fuel' });
  await screen.getByRole('searchbox', { name: placeholder }).fill('water');
  await screen.getByRole('button', { name: 'Search', exact: true }).click();
  await expect.poll(() => router.state.location.search.search).toBe('water');
  const url = router.state.location.href;
  await cleanup();
  const reloaded = await renderRoute({ initialEntry: url, overviewRoute: appRoute, seedQueryClient });
  await expect.element(reloaded.screen.getByRole('searchbox', { name: placeholder })).toHaveValue('water');
  // Default page and sort stay out of the URL.
  expect(reloaded.router.state.location.search).toEqual({ search: 'water' });
});

test('rules restore their table state and switching tabs starts the other table fresh', async () => {
  const requests: URL[] = [];
  worker.use(
    ...['categories', 'category-rules'].map((feature) =>
      http.get(`http://localhost:5000/api/spaces/space/${feature}`, ({ request }) => {
        const url = new URL(request.url);
        requests.push(url);
        return HttpResponse.json({
          items: [],
          page: Number(url.searchParams.get('page') ?? 1),
          pageSize: 10,
          totalCount: 35,
        });
      }),
    ),
  );
  const { router, screen, cleanup } = await renderRoute({
    initialEntry: '/space/finances/categories?tab=rules&search=merchant&page=3&sort=label&descending=true',
    overviewRoute: appRoute,
    seedQueryClient,
  });
  const rulesSearch = screen.getByRole('searchbox', { name: 'Search matches or category...' });
  await expect.element(rulesSearch).toHaveValue('merchant');
  await expect
    .poll(() => requests.findLast((url) => url.pathname.endsWith('/category-rules'))?.searchParams.get('sort'))
    .toBe('Label');

  await screen.getByRole('tab', { name: 'Categories', exact: true }).click();
  await expect.element(screen.getByRole('searchbox', { name: 'Search name...' })).toHaveValue('');
  // The default tab, page and search stay out of the URL.
  await expect.poll(() => router.state.location.search).toEqual({});

  router.history.back();
  await expect.element(rulesSearch).toHaveValue('merchant');
  const url = router.state.location.href;
  await cleanup();
  const reloaded = await renderRoute({ initialEntry: url, overviewRoute: appRoute, seedQueryClient });
  await expect
    .element(reloaded.screen.getByRole('searchbox', { name: 'Search matches or category...' }))
    .toHaveValue('merchant');
  expect(reloaded.router.state.location.search).toEqual({
    tab: 'rules',
    search: 'merchant',
    page: 3,
    sort: 'label',
    descending: true,
  });
});

function seedQueryClient(client: QueryClient) {
  client.setQueryData(queryKeys.users.me, {
    status: 'Ready',
    user: { id: 'user', spaces: [{ id: 'space', isPersonal: true, role: { permissions: [] } }] },
  });
  client.setQueryData(queryKeys.resources.list('space'), listPage([]));
}
