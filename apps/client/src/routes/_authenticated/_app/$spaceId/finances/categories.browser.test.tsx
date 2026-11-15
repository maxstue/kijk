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
      return HttpResponse.json({ items: [], page: Number(query.get('page') ?? 1), totalCount: 35 });
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
  await expect
    .poll(() => router.state.location.search)
    .toMatchObject({ page: 1, search: 'fuel', sort: 'name', descending: false });
  await screen.getByRole('searchbox', { name: placeholder }).fill('water');
  await screen.getByRole('button', { name: 'Search', exact: true }).click();
  await expect.poll(() => router.state.location.search.search).toBe('water');
  const url = router.state.location.href;
  await cleanup();
  const reloaded = await renderRoute({ initialEntry: url, overviewRoute: appRoute, seedQueryClient });
  await expect.element(reloaded.screen.getByRole('searchbox', { name: placeholder })).toHaveValue('water');
  expect(reloaded.router.state.location.search).toMatchObject({ page: 1, search: 'water', descending: false });
});

test('categories and rules keep separate searches and pages while switching tabs', async () => {
  worker.use(
    ...['categories', 'category-rules'].map((feature) =>
      http.get(`http://localhost:5000/api/spaces/space/${feature}`, ({ request }) =>
        HttpResponse.json({ items: [], page: Number(new URL(request.url).searchParams.get('page')), totalCount: 35 }),
      ),
    ),
  );
  const { router, screen, cleanup } = await renderRoute({
    initialEntry:
      '/space/finances/categories?search=category&page=2&tab=rules&rulesSearch=merchant&rulesPage=3&rulesSort=label&rulesDescending=true',
    overviewRoute: appRoute,
    seedQueryClient,
  });
  await expect
    .element(screen.getByRole('searchbox', { name: 'Search matches or category...' }))
    .toHaveValue('merchant');
  await screen.getByRole('tab', { name: 'Categories', exact: true }).click();
  await expect.element(screen.getByRole('searchbox', { name: 'Search name...' })).toHaveValue('category');
  expect(router.state.location.search).toMatchObject({ page: 2, rulesPage: 3 });
  await screen.getByRole('tab', { name: 'Categorization rules', exact: true }).click();
  await expect
    .element(screen.getByRole('searchbox', { name: 'Search matches or category...' }))
    .toHaveValue('merchant');
  const url = router.state.location.href;
  await cleanup();
  const reloaded = await renderRoute({ initialEntry: url, overviewRoute: appRoute, seedQueryClient });
  await expect
    .element(reloaded.screen.getByRole('searchbox', { name: 'Search matches or category...' }))
    .toHaveValue('merchant');
  expect(reloaded.router.state.location.search).toMatchObject({
    tab: 'rules',
    page: 2,
    rulesPage: 3,
    rulesSort: 'label',
    rulesDescending: true,
  });
});

function seedQueryClient(client: QueryClient) {
  client.setQueryData(queryKeys.users.me, {
    status: 'Ready',
    user: { id: 'user', spaces: [{ id: 'space', isPersonal: true, role: { permissions: [] } }] },
  });
  client.setQueryData(queryKeys.resources.list('space'), listPage([]));
}
