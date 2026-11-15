import { queryKeys } from '@kijk/api/query-keys';
import type { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { expect, test } from 'vite-plus/test';

import { Route as appRoute } from '@/routes/_authenticated/_app/route';
import { listPage } from '@/test/list-page';
import { worker } from '@/test/mocks/browser';
import { renderRoute } from '@/test/render-route';

test('restores the review step, open panels and independent card-statement page from the URL', async () => {
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
  const initialEntry =
    '/space/finances/imports/import?reviewStage=review&adjustmentsOpen=true&cardOpen=true&cardPage=3&page=2&search=bank';
  const { screen, router, cleanup } = await renderRoute({ initialEntry, overviewRoute: appRoute, seedQueryClient });
  const cards = screen.getByRole('navigation', { name: 'Card statement pages' });
  await expect.element(cards).toBeVisible();
  await expect
    .poll(() =>
      requests
        .filter((query) => query.get('cardSettlementsOnly') === 'true')
        .at(-1)
        ?.get('page'),
    )
    .toBe('3');
  expect(
    requests.every((query) => !query.has('cardOpen') && !query.has('reviewStage') && !query.has('adjustmentsOpen')),
  ).toBe(true);
  await cards.getByRole('button', { name: 'Next rows' }).click();
  await expect.poll(() => router.state.location.search.cardPage).toBe(4);
  expect(router.state.location.search.page).toBe(2);
  router.history.back();
  await expect.poll(() => router.state.location.search.cardPage).toBe(3);
  const url = router.state.location.href;
  await cleanup();
  const restored = await renderRoute({ initialEntry: url, overviewRoute: appRoute, seedQueryClient });
  await expect.element(restored.screen.getByRole('navigation', { name: 'Card statement pages' })).toBeVisible();
  expect(restored.router.state.location.search).toMatchObject({
    page: 2,
    cardPage: 3,
    cardOpen: true,
    adjustmentsOpen: true,
    reviewStage: 'review',
  });
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
