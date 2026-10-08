import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { queryKeys } from '@/shared/api/query-keys';

import { TransactionCategoryFilter } from './category-filter';

const categories = [
  {
    color: '#16a34a',
    creatorType: 'System',
    icon: 'shopping-basket',
    id: 'groceries',
    kind: 'Expense',
    name: 'Groceries',
  },
  { color: '#2563eb', creatorType: 'System', icon: 'house', id: 'housing', kind: 'Expense', name: 'Housing' },
];

function renderFilter(value: string[], onChange: (categoryIds: string[]) => void) {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData(queryKeys.categories.list(), categories);
  return render(
    <QueryClientProvider client={client}>
      <TransactionCategoryFilter value={value} onChange={onChange} />
    </QueryClientProvider>,
  );
}

test('adds a category to the selection', async () => {
  const onChange = vi.fn<(categoryIds: string[]) => void>();
  const screen = await renderFilter(['groceries'], onChange);

  // The selected category shows as a badge in the trigger.
  await expect.element(screen.getByRole('button', { name: 'Category Groceries' })).toBeVisible();
  await screen.getByRole('button', { name: /Category/ }).click();
  await screen.getByRole('option', { name: 'Housing' }).click();

  expect(onChange).toHaveBeenCalledWith(['groceries', 'housing']);
  await screen.unmount();
});

test('clears the selection', async () => {
  const onChange = vi.fn<(categoryIds: string[]) => void>();
  const screen = await renderFilter(['groceries', 'housing'], onChange);

  await screen.getByRole('button', { name: /Category/ }).click();
  await screen.getByRole('option', { name: 'Clear filter' }).click();

  expect(onChange).toHaveBeenCalledWith([]);
  await screen.unmount();
});
