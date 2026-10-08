import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { queryKeys } from '@/shared/api/query-keys';

import { BudgetStatistics } from './statistics';

const months = Array.from(
  { length: 12 },
  (_, index) => `${index < 2 ? 2025 : 2026}-${String(((index + 10) % 12) + 1).padStart(2, '0')}-01`,
);
const zeros = months.map(() => 0);

test('shows a small chart per category, the uncategorized spending and a table view', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData(queryKeys.budgets.statistics(2026, 10, 12), {
    categories: [
      {
        budget: months.map(() => 300),
        categoryId: 'g',
        color: '#16a34a',
        name: 'Groceries',
        spent: months.map(() => 250),
      },
      {
        budget: months.map(() => null),
        categoryId: 'l',
        color: '#db2777',
        name: 'Leisure',
        spent: [...zeros.slice(1), 40],
      },
    ],
    months,
    totalBudget: months.map(() => 300),
    totalSpent: months.map(() => 260),
    uncategorized: [...zeros.slice(1), 10],
  });

  const screen = await render(
    <QueryClientProvider client={client}>
      <BudgetStatistics month={10} year={2026} />
    </QueryClientProvider>,
  );

  // Sorted by spending: all expenses first, then Groceries before Leisure, uncategorized last.
  await expect.element(screen.getByText('All expenses')).toBeVisible();
  await expect.element(screen.getByText('Groceries')).toBeVisible();
  await expect.element(screen.getByText('Uncategorized')).toBeVisible();
  const groceryChart = screen.getByRole('img', { name: 'Groceries: spending and budget over time' });
  await expect.element(groceryChart).toBeVisible();
  expect(groceryChart.element().querySelectorAll('.ts-chart__bar path')).toHaveLength(12);
  expect(groceryChart.element().querySelector('.ts-chart__line path')?.getAttribute('stroke-dasharray')).toBe('4 3');
  expect(
    screen
      .getByRole('img', { name: 'Leisure: spending and budget over time' })
      .element()
      .querySelector('.ts-chart__line path'),
  ).toBeNull();
  await screen.getByRole('tab', { name: 'Table' }).click();
  await expect.element(screen.getByRole('row', { name: /Leisure/ })).toBeVisible();
  await expect.element(screen.getByText('Category', { exact: true })).toBeVisible();
  await screen.unmount();
  client.clear();
});

test('leaves gaps in the budget reference line for months without a budget', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  const budget = [300, 300, null, null, 300, 300, 300, 300, 300, 300, 300, 300];
  client.setQueryData(queryKeys.budgets.statistics(2026, 10, 12), {
    categories: [{ budget, categoryId: 'g', name: 'Groceries', spent: zeros }],
    months,
    totalBudget: budget.map((value) => value ?? 0),
    totalSpent: zeros,
    uncategorized: zeros,
  });

  const screen = await render(
    <QueryClientProvider client={client}>
      <BudgetStatistics month={10} year={2026} />
    </QueryClientProvider>,
  );
  const chart = screen.getByRole('img', { name: 'Groceries: spending and budget over time' });
  await expect.element(chart).toBeVisible();
  const segments = chart.element().querySelectorAll('.ts-chart__line path');
  expect(segments).toHaveLength(2);
  await screen.unmount();
  client.clear();
});
