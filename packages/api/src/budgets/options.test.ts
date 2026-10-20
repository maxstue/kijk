import { QueryClient } from '@tanstack/react-query';
import { expect, test, vi } from 'vite-plus/test';

import { queryKeys } from '../query-keys';
import { setFromMonthMutationOptions } from './options';
import { setFromMonth } from './requests';
import type { Budget } from './types';

vi.mock('./requests', { spy: true });

test('setting a budget refreshes versions, the overview and statistics only in the affected space', async () => {
  const client = new QueryClient();
  const keys = [
    queryKeys.budgets.list('space'),
    queryKeys.budgets.overview('space', 2026, 10),
    queryKeys.budgets.statistics('space', 2026, 10, 12),
  ];
  for (const key of [...keys, queryKeys.budgets.list('other')]) {
    client.setQueryData(key, []);
  }
  vi.mocked(setFromMonth).mockResolvedValue({ id: 'budget' } as Budget);
  const data = {
    categoryId: 'category',
    validFrom: '2026-10-01',
    amount: 200,
    active: true,
    visibility: 'Private' as const,
  };
  await client.getMutationCache().build(client, setFromMonthMutationOptions('space')).execute(data);

  expect(setFromMonth).toHaveBeenCalledWith('space', data);
  for (const key of keys) {
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  }
  expect(client.getQueryState(queryKeys.budgets.list('other'))?.isInvalidated).toBe(false);
  client.clear();
});
