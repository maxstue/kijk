import { QueryClient } from '@tanstack/react-query';
import { expect, test, vi } from 'vite-plus/test';

import { queryKeys } from '../query-keys';
import { shareWithSpaceMutationOptions, updateMutationOptions } from './options';
import { shareWithSpace, update } from './requests';

vi.mock('./requests', { spy: true });

test('sharing a unit refreshes that space and personal units while retaining other spaces', async () => {
  const client = new QueryClient();
  const personal = queryKeys.units.list({ scope: 'Personal' });
  const selected = queryKeys.units.list({ scope: 'Space', spaceId: 'selected' });
  const other = queryKeys.units.list({ scope: 'Space', spaceId: 'other' });
  for (const key of [personal, selected, other]) {
    client.setQueryData(key, []);
  }
  vi.mocked(shareWithSpace).mockResolvedValue();
  await client
    .getMutationCache()
    .build(client, shareWithSpaceMutationOptions())
    .execute({ id: 'unit', spaceId: 'selected' });
  expect(client.getQueryState(personal)?.isInvalidated).toBe(true);
  expect(client.getQueryState(selected)?.isInvalidated).toBe(true);
  expect(client.getQueryState(other)?.isInvalidated).toBe(false);
  client.clear();
});

test('renaming a shared unit refreshes limit labels in every space', async () => {
  const client = new QueryClient();
  for (const space of ['first', 'second']) {
    client.setQueryData(queryKeys.limits.list(space), []);
  }
  vi.mocked(update).mockResolvedValue({ id: 'unit' } as Awaited<ReturnType<typeof update>>);
  await client
    .getMutationCache()
    .build(client, updateMutationOptions())
    .execute({
      id: 'unit',
      data: { name: 'Bucket', symbol: 'bkt', referenceUnitId: 'liter', conversionFactor: 10 },
    });
  for (const space of ['first', 'second']) {
    expect(client.getQueryState(queryKeys.limits.list(space))?.isInvalidated).toBe(true);
  }
  client.clear();
});
