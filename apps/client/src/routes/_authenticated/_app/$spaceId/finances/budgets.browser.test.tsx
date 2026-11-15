import { queryKeys } from '@kijk/api/query-keys';
import type { QueryClient } from '@tanstack/react-query';
import { expect, test } from 'vite-plus/test';

import { Route as appRoute } from '@/routes/_authenticated/_app/route';
import { listPage } from '@/test/list-page';
import { renderRoute } from '@/test/render-route';

test('restores the budget statistics table tab through history and reload', async () => {
  const { router, screen, cleanup } = await renderRoute({
    initialEntry: '/space/finances/budgets?view=spending&year=2026&month=10&statisticsView=table',
    overviewRoute: appRoute,
    seedQueryClient,
  });
  await expect
    .element(screen.getByRole('tab', { name: 'Table', exact: true }))
    .toHaveAttribute('aria-selected', 'true');
  await screen.getByRole('tab', { name: 'Chart', exact: true }).click();
  await expect.poll(() => router.state.location.search.statisticsView).toBe('chart');
  router.history.back();
  await expect
    .element(screen.getByRole('tab', { name: 'Table', exact: true }))
    .toHaveAttribute('aria-selected', 'true');
  const url = router.state.location.href;
  await cleanup();
  const restored = await renderRoute({ initialEntry: url, overviewRoute: appRoute, seedQueryClient });
  await expect.element(restored.screen.getByRole('table')).toBeVisible();
});

function seedQueryClient(client: QueryClient) {
  client.setQueryData(queryKeys.budgets.overview('space', 2026, 10), {
    categories: [],
    totalBudget: 0,
    totalSpent: 0,
    income: 0,
    uncategorizedIncome: 0,
    uncategorizedExpenses: 0,
    pendingCount: 0,
  });
  client.setQueryData(queryKeys.budgets.list('space'), []);
  client.setQueryData(queryKeys.categories.list('space'), listPage([]));
  client.setQueryData(queryKeys.budgets.statistics('space', 2026, 10, 12), {
    months: ['2026-10-01'],
    totalBudget: [100],
    totalSpent: [50],
    categories: [],
    uncategorized: [0],
  });
}
