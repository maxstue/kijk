import { QueryClient } from '@tanstack/react-query';
import { expect, test, vi } from 'vite-plus/test';

import { queryKeys } from '@/shared/api/query-keys';

import { clearHouseholdData } from './helpers';

test('loads the remaining household instead of fresh cached data from the deleted household', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } });
  const keys = [
    queryKeys.resources.list(),
    queryKeys.consumptions.by('2026'),
    queryKeys.consumptions.stats('2026'),
    queryKeys.consumptions.years(),
    queryKeys.consumptionLimits.list(),
    queryKeys.units.list(),
    queryKeys.households.members('deleted-household'),
  ];
  for (const queryKey of keys) {
    client.setQueryData(queryKey, ['deleted-household']);
  }
  client.setQueryData(queryKeys.users.me, { user: 'current-user' });

  await clearHouseholdData(client);

  for (const queryKey of keys) {
    const queryFn = vi.fn<() => Promise<string[]>>(async () => ['remaining-household']);
    expect(await client.ensureQueryData({ queryKey, queryFn })).toEqual(['remaining-household']);
    expect(queryFn).toHaveBeenCalledOnce();
  }
  expect(client.getQueryData(queryKeys.users.me)).toEqual({ user: 'current-user' });
  client.clear();
});

test('cancels an in-flight household request before removing it', async () => {
  const client = new QueryClient();
  let requestSignal: AbortSignal | undefined;
  const request = client
    .fetchQuery({
      queryKey: queryKeys.resources.list(),
      queryFn: ({ signal }) => {
        requestSignal = signal;
        return new Promise<string[]>(() => undefined);
      },
    })
    .catch(() => undefined);

  await clearHouseholdData(client);
  await request;

  expect(requestSignal?.aborted).toBe(true);
  expect(client.getQueryState(queryKeys.resources.list())).toBeUndefined();
  client.clear();
});
