import { QueryClient } from '@tanstack/react-query';
import { expect, test, vi } from 'vite-plus/test';

import { queryKeys } from '../query-keys';
import { updateConsumptionMutationOptions } from './options';
import { updateConsumption } from './requests';
import type { Consumption } from './types';

vi.mock('./requests', { spy: true });

test('editing a reading refreshes statistics for both its old and new month', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  const oldMonth = queryKeys.consumptions.stats('2026', 'September');
  const newMonth = queryKeys.consumptions.stats('2026', 'October');
  for (const key of [oldMonth, newMonth, queryKeys.limits.list()]) {
    client.setQueryData(key, []);
  }
  const updated = { id: 'reading', value: 200 } as unknown as Consumption;
  vi.mocked(updateConsumption).mockResolvedValue(updated);

  await client
    .getMutationCache()
    .build(client, updateConsumptionMutationOptions())
    .execute({
      id: 'reading',
      consumption: { date: new Date(2026, 9, 1), value: 200 },
    });

  expect(client.getQueryState(oldMonth)?.isInvalidated).toBe(true);
  expect(client.getQueryState(newMonth)?.isInvalidated).toBe(true);
  expect(client.getQueryState(queryKeys.limits.list())?.isInvalidated).toBe(true);
  expect(client.getQueryData(queryKeys.consumptions.detail('reading'))).toEqual(updated);
  client.clear();
});
