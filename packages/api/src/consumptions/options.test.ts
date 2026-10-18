import { QueryClient } from '@tanstack/react-query';
import { expect, test, vi } from 'vite-plus/test';

import { queryKeys } from '../query-keys';
import {
  createConsumptionMutationOptions,
  deleteConsumptionMutationOptions,
  updateConsumptionMutationOptions,
} from './options';
import { createConsumption, deleteConsumption, updateConsumption } from './requests';
import type { Consumption } from './types';

vi.mock('./requests', { spy: true });

test('editing a reading refreshes statistics for both its old and new month', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  const oldMonth = queryKeys.consumptions.stats('space', '2026', 'September');
  const newMonth = queryKeys.consumptions.stats('space', '2026', 'October');
  for (const key of [oldMonth, newMonth, queryKeys.limits.list('space'), queryKeys.consumptions.years('space')]) {
    client.setQueryData(key, []);
  }
  client.setQueryData(queryKeys.consumptions.stats('other', '2026', 'October'), []);
  const updated = { id: 'reading', value: 200 } as unknown as Consumption;
  vi.mocked(updateConsumption).mockResolvedValue(updated);

  await client
    .getMutationCache()
    .build(client, updateConsumptionMutationOptions('space'))
    .execute({
      id: 'reading',
      consumption: { date: new Date(2026, 9, 1), value: 200 },
    });

  expect(client.getQueryState(oldMonth)?.isInvalidated).toBe(true);
  expect(client.getQueryState(newMonth)?.isInvalidated).toBe(true);
  expect(client.getQueryState(queryKeys.limits.list('space'))?.isInvalidated).toBe(true);
  expect(client.getQueryState(queryKeys.consumptions.years('space'))?.isInvalidated).toBe(true);
  expect(client.getQueryData(queryKeys.consumptions.detail('space', 'reading'))).toEqual(updated);
  expect(client.getQueryState(queryKeys.consumptions.stats('other', '2026', 'October'))?.isInvalidated).toBe(false);
  expect(client.getQueryState(queryKeys.consumptions.detail('other', 'reading'))).toBeUndefined();
  client.clear();
});

test('adding the first reading of a year refreshes years only in its space', async () => {
  const client = new QueryClient();
  client.setQueryData(queryKeys.consumptions.years('space'), [2026]);
  client.setQueryData(queryKeys.consumptions.years('other'), [2026]);
  vi.mocked(createConsumption).mockResolvedValue({ id: 'new' } as Consumption);
  await client
    .getMutationCache()
    .build(client, createConsumptionMutationOptions('space'))
    .execute({
      name: 'New year',
      date: new Date(2027, 0, 1),
      resourceId: 'resource',
      value: 1,
      valueType: 'Relative',
      startsNewMeterSegment: false,
    });
  expect(client.getQueryState(queryKeys.consumptions.years('space'))?.isInvalidated).toBe(true);
  expect(client.getQueryState(queryKeys.consumptions.years('other'))?.isInvalidated).toBe(false);
  client.clear();
});

test('deleting the last reading of a year refreshes the available years', async () => {
  const client = new QueryClient();
  client.setQueryData(queryKeys.consumptions.years('space'), [2026]);
  vi.mocked(deleteConsumption).mockResolvedValue();
  await client.getMutationCache().build(client, deleteConsumptionMutationOptions('space')).execute({ id: 'last' });
  expect(client.getQueryState(queryKeys.consumptions.years('space'))?.isInvalidated).toBe(true);
  client.clear();
});
