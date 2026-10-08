import { expect, test } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-react';

import type { BudgetCategory } from '@/shared/api/budgets/types';
import { formatStringToCurrency } from '@/shared/utils/format';

import { BudgetChart } from './chart';

const categories: BudgetCategory[] = [
  {
    categoryId: 'games',
    name: 'Games',
    icon: 'tag',
    color: '#16a34a',
    budgetId: 'games-budget',
    budget: '100',
    spent: '35',
    pending: 0,
    remaining: 65,
    utilizationPercentage: 35,
    isExceeded: false,
    budgetVisibility: 'Shared',
  },
];

test('renders separate budget and spending bars with an accessible grouped currency tooltip', async () => {
  const screen = await render(<BudgetChart categories={categories} />);
  const chart = screen.getByRole('img', { name: 'Budget and spending per category' });
  await expect.element(chart).toBeVisible();
  const bars = chart.element().querySelectorAll('.ts-chart__bar rect');
  expect(bars).toHaveLength(2);
  expect(bars[0]!.getAttribute('x')).not.toBe(bars[1]!.getAttribute('x'));

  await chart.click();
  await userEvent.keyboard('{Home}');
  const tooltip = screen.getByRole('status');
  await expect.element(tooltip.getByText('Games', { exact: true })).toBeVisible();
  await expect.element(tooltip.getByText('Budget', { exact: true })).toBeVisible();
  await expect.element(tooltip.getByText('Spent', { exact: true })).toBeVisible();
  await expect.element(tooltip.getByText(formatStringToCurrency(100), { exact: true })).toBeVisible();
  await expect.element(tooltip.getByText(formatStringToCurrency(35), { exact: true })).toBeVisible();
  await userEvent.keyboard('{Escape}');
  await expect.element(tooltip).not.toBeInTheDocument();
  await screen.unmount();
});
