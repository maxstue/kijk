import '@kijk/ui/globals.css';
import * as budgetsApi from '@kijk/api/budgets/requests';
import type { Budget } from '@kijk/api/budgets/types';
import { queryKeys } from '@kijk/api/query-keys';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, test, vi } from 'vite-plus/test';

import { render } from '@/test/render-space';

import { BudgetForm } from './form';

vi.mock('@kijk/api/budgets/requests', { spy: true });
vi.mock('@/shared/hooks/use-space-permission', () => ({ useSpacePermission: () => true }));
vi.mock('@/shared/hooks/use-active-space', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/hooks/use-active-space')>()),
  useActiveSpace: () => ({ isPersonal: true }),
}));

test('saves a budget by category and month without loading budget versions first', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  client.setQueryData(queryKeys.categories.list('space'), [{ id: 'groceries', name: 'Groceries', kind: 'Expense' }]);
  vi.mocked(budgetsApi.setFromMonth).mockResolvedValue({ id: 'budget' } as Budget);
  const onClose = vi.fn<() => void>();
  const screen = await render(
    <QueryClientProvider client={client}>
      <BudgetForm
        categoryId='groceries'
        initialAmount={300}
        initialVisibility='Private'
        month={10}
        year={2026}
        onClose={onClose}
      />
    </QueryClientProvider>,
  );
  try {
    await screen.getByRole('spinbutton', { name: 'Monthly amount (EUR)' }).fill('450');
    await screen.getByRole('button', { name: 'Save budget' }).click();
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(budgetsApi.setFromMonth).toHaveBeenCalledWith('space', {
      categoryId: 'groceries',
      validFrom: '2026-10-01',
      amount: 450,
      active: true,
      visibility: 'Private',
    });
    expect(client.getQueryState(queryKeys.budgets.list('space'))).toBeUndefined();
  } finally {
    await screen.unmount();
    client.clear();
  }
});
