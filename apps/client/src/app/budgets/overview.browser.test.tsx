import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { queryKeys } from '@/shared/api/query-keys';
import { formatStringToCurrency } from '@/shared/utils/format';

import { BudgetOverview } from './overview';

vi.mock('@/shared/hooks/use-space-permission', () => ({ useSpacePermission: () => true }));
vi.mock('@/app/budgets/chart', () => ({ BudgetChart: () => <div>Budget comparison</div> }));

const categories = [
  {
    budget: '100',
    categoryId: 'games',
    color: '#16a34a',
    isExceeded: false,
    name: 'Games',
    pending: 0,
    remaining: '65',
    spent: '35',
    utilizationPercentage: 35,
  },
  {
    budget: 0,
    categoryId: 'shopping',
    color: '#db2777',
    isExceeded: true,
    name: 'Shopping',
    pending: 0,
    remaining: -5,
    spent: 5,
    utilizationPercentage: 100,
  },
  {
    budget: null,
    categoryId: 'groceries',
    color: '#16a34a',
    isExceeded: false,
    name: 'Groceries',
    pending: 0,
    remaining: null,
    spent: 300,
    utilizationPercentage: null,
  },
];

function createClient(selectedCategories = categories) {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData(queryKeys.budgets.overview(2026, 10), {
    categories: selectedCategories,
    income: 0,
    pendingExpenses: 0,
    totalBudget: selectedCategories === categories ? '100' : 0,
    totalSpent: selectedCategories === categories ? 340 : 300,
    uncategorizedExpenses: 0,
    uncategorizedIncome: 0,
  });
  return client;
}

test('defaults to planned budgets, includes zero budgets and limits totals to budgeted categories', async () => {
  const client = createClient();
  const screen = await render(
    <QueryClientProvider client={client}>
      <BudgetOverview month={10} year={2026} />
    </QueryClientProvider>,
  );

  await expect.element(screen.getByText('Games', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Shopping', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Groceries', { exact: true })).not.toBeInTheDocument();
  await expect.element(screen.getByText('No budget', { exact: true })).not.toBeInTheDocument();
  await expect.element(screen.getByText(formatStringToCurrency(40), { exact: true })).toBeVisible();
  await expect.element(screen.getByText(formatStringToCurrency(60), { exact: true })).toBeVisible();
  await screen.unmount();
  client.clear();
});

test('category spending includes categories with and without budgets and their combined spending', async () => {
  const client = createClient();
  const screen = await render(
    <QueryClientProvider client={client}>
      <BudgetOverview month={10} view='spending' year={2026} />
    </QueryClientProvider>,
  );

  await expect.element(screen.getByText('Games', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Groceries', { exact: true })).toBeVisible();
  await expect.element(screen.getByText(formatStringToCurrency(340), { exact: true })).toBeVisible();
  await expect.element(screen.getByText(formatStringToCurrency(300), { exact: true })).toBeVisible();
  await expect.element(screen.getByRole('button', { name: 'Set budget', exact: true })).toBeVisible();
  await expect.element(screen.getByText('Budget comparison', { exact: true })).not.toBeInTheDocument();
  await screen.unmount();
  client.clear();
});

test('shows the budget empty state even when unbudgeted categories have spending', async () => {
  const client = createClient(categories.filter((category) => category.budget === null));
  const screen = await render(
    <QueryClientProvider client={client}>
      <BudgetOverview month={10} year={2026} />
    </QueryClientProvider>,
  );

  await expect.element(screen.getByText('No budgets this month', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('Groceries', { exact: true })).not.toBeInTheDocument();
  await expect.element(screen.getByText('Budget comparison', { exact: true })).not.toBeInTheDocument();
  await screen.unmount();
  client.clear();
});
