import { queryKeys } from '@kijk/api/query-keys';
import { categorizeTransaction } from '@kijk/api/transactions/requests';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, test, vi } from 'vite-plus/test';

import { render } from '@/test/render-space';

import { RuleSuggestions } from './rule-suggestions';

vi.mock('@kijk/api/transactions/requests', { spy: true });

const suggestions = [
  {
    categoryId: 'groceries',
    categoryName: 'Groceries',
    id: 'rewe',
    label: 'REWE Markt',
    manualCount: 2,
    scope: 'Merchant',
    transactionId: 'transaction-1',
    uncategorizedCount: 3,
  },
  {
    categoryId: 'housing',
    categoryName: 'Housing',
    id: 'utility',
    label: 'Stadtwerke',
    manualCount: 2,
    scope: 'Counterparty',
    transactionId: 'transaction-2',
    uncategorizedCount: 0,
  },
];

afterEach(() => localStorage.clear());

function renderSuggestions(canRecord = true) {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData(queryKeys.categoryRules.suggestions('space'), suggestions);
  return render(
    <QueryClientProvider client={client}>
      <RuleSuggestions canRecord={canRecord} />
    </QueryClientProvider>,
  );
}

test('remembering a suggestion creates the rule from its latest correction', async () => {
  vi.mocked(categorizeTransaction).mockResolvedValue({ appliedToOthers: 3 } as Awaited<
    ReturnType<typeof categorizeTransaction>
  >);
  const screen = await renderSuggestions();

  await expect.element(screen.getByText('REWE Markt → Groceries')).toBeVisible();
  await expect.element(screen.getByText(/categorizes 3 open transactions/)).toBeVisible();
  await screen.getByRole('button', { name: 'Remember' }).first().click();

  await vi.waitFor(() =>
    expect(categorizeTransaction).toHaveBeenCalledWith('space', {
      correction: { categoryId: 'groceries', remember: true },
      id: 'transaction-1',
    }),
  );
  await screen.unmount();
  vi.mocked(categorizeTransaction).mockReset();
});

test('hidden suggestions stay hidden', async () => {
  const screen = await renderSuggestions();
  await screen.getByRole('button', { name: 'Hide' }).first().click();
  await expect.element(screen.getByText('REWE Markt → Groceries')).not.toBeInTheDocument();
  await screen.unmount();

  const again = await renderSuggestions();
  await expect.element(again.getByText('Stadtwerke → Housing')).toBeVisible();
  await expect.element(again.getByText('REWE Markt → Groceries')).not.toBeInTheDocument();
  await again.unmount();
});

test('viewers see suggestions but cannot remember them', async () => {
  const screen = await renderSuggestions(false);
  await expect.element(screen.getByRole('button', { name: 'Remember' }).first()).toBeDisabled();
  await screen.unmount();
});
