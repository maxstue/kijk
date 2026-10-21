import { QueryClient } from '@tanstack/react-query';
import { expect, test, vi } from 'vite-plus/test';

import { queryKeys } from '../query-keys';
import { setDefaultSpaceMutationOptions, updateMutationOptions } from './options';
import { setDefaultSpace, update } from './requests';
import type { CurrentUser } from './types';

vi.mock('./requests', { spy: true });

test('choosing a default space keeps the cached data of every space', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  const currentUser = { user: { id: 'user' } } as CurrentUser;
  client.setQueryData(queryKeys.accounts.list('space'), ['account']);
  vi.mocked(setDefaultSpace).mockResolvedValue(currentUser);

  await client.getMutationCache().build(client, setDefaultSpaceMutationOptions()).execute('space');

  expect(client.getQueryData(queryKeys.users.me)).toBe(currentUser);
  expect(client.getQueryData(queryKeys.accounts.list('space'))).toEqual(['account']);
  expect(client.getQueryState(queryKeys.accounts.list('space'))?.isInvalidated).toBe(false);
  client.clear();
});

test('changing user settings refreshes the resources of every space', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  for (const key of [
    queryKeys.resources.list('first'),
    queryKeys.resources.list('second'),
    queryKeys.limits.list('first'),
  ]) {
    client.setQueryData(key, []);
  }
  vi.mocked(update).mockResolvedValue({} as Awaited<ReturnType<typeof update>>);

  await client.getMutationCache().build(client, updateMutationOptions()).execute({ userName: 'Kim' });

  expect(client.getQueryState(queryKeys.resources.list('first'))?.isInvalidated).toBe(true);
  expect(client.getQueryState(queryKeys.resources.list('second'))?.isInvalidated).toBe(true);
  expect(client.getQueryState(queryKeys.limits.list('first'))?.isInvalidated).toBe(false);
  client.clear();
});
