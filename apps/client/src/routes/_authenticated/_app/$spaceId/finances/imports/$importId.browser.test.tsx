import { queryKeys } from '@kijk/api/query-keys';
import type { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { expect, test } from 'vite-plus/test';

import { Route as appRoute } from '@/routes/_authenticated/_app/route';
import { listPage } from '@/test/list-page';
import { worker } from '@/test/mocks/browser';
import { renderRoute } from '@/test/render-route';

test('applies the review page and search from the URL and keeps them on reload', async () => {
  const requests: URLSearchParams[] = [];
  worker.use(
    http.get('http://localhost:5000/api/spaces/space/imports/import/candidates', ({ request }) => {
      const query = new URL(request.url).searchParams;
      requests.push(query);
      const card = query.get('cardSettlementsOnly') === 'true';
      return HttpResponse.json({
        items: [
          {
            id: 'candidate',
            amount: 20,
            bookingDate: '2026-10-01',
            counterparty: card ? 'Card statement' : 'Merchant',
            purpose: null,
            categoryId: null,
            excluded: false,
            errors: null,
            status: 'Booked',
            isCardSettlement: card,
            countsAsOffset: false,
          },
        ],
        page: Number(query.get('page') ?? 1),
        pageSize: 100,
        totalCount: 500,
        includedCount: 500,
        cardSettlementCount: 500,
        errorCount: 0,
        errorSamples: [],
      });
    }),
  );
  const initialEntry = '/space/finances/imports/import?page=2&search=bank';
  const { screen, router, cleanup } = await renderRoute({ initialEntry, overviewRoute: appRoute, seedQueryClient });
  await screen.getByRole('button', { name: 'Continue to review' }).click();
  await screen.getByRole('button', { name: 'Adjust transactions' }).click();

  const pages = screen.getByRole('navigation', { name: 'Transaction pages' });
  await expect.element(pages).toBeVisible();
  const reviewRequest = () => requests.filter((query) => query.get('cardSettlementsOnly') !== 'true').at(-1);
  await expect.poll(() => reviewRequest()?.get('page')).toBe('2');
  expect(reviewRequest()?.get('search')).toBe('bank');
  await expect.element(screen.getByRole('searchbox', { name: 'Search review transactions' })).toHaveValue('bank');

  await pages.getByRole('button', { name: 'Next rows' }).click();
  await expect.poll(() => router.state.location.search.page).toBe(3);
  router.history.back();
  await expect.poll(() => router.state.location.search.page).toBe(2);

  const url = router.state.location.href;
  await cleanup();
  const restored = await renderRoute({ initialEntry: url, overviewRoute: appRoute, seedQueryClient });
  expect(restored.router.state.location.search).toMatchObject({ page: 2, search: 'bank' });
});

function seedQueryClient(client: QueryClient) {
  client.setQueryData(queryKeys.users.features, { finances: true, aiImport: false });
  client.setQueryData(queryKeys.categories.list('space'), listPage([]));
  client.setQueryData(queryKeys.imports.detail('space', 'import'), {
    id: 'import',
    status: 'NeedsReview',
    accountName: 'Checking',
    fileName: 'statement.csv',
    fullMonths: ['2026-10-01'],
    edgeMonths: [],
    hasHighErrorRate: false,
    errorCount: 0,
    rowCount: 500,
    aiCategorizedCount: 0,
  });
}
