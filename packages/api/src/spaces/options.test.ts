import { QueryClient } from '@tanstack/react-query';
import { expect, test, vi } from 'vite-plus/test';

import { queryKeys } from '../query-keys';
import { deleteSpaceMutationOptions } from './options';
import { deleteSpace } from './requests';

vi.mock('./requests', { spy: true });

test('deleting a space drops its cached data and keeps the other spaces', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData(queryKeys.accounts.list('deleted'), ['account']);
  client.setQueryData(queryKeys.spaces.members('deleted'), ['member']);
  client.setQueryData(queryKeys.accounts.list('other'), ['account']);
  vi.mocked(deleteSpace).mockResolvedValue();

  await client.getMutationCache().build(client, deleteSpaceMutationOptions()).execute('deleted');

  expect(client.getQueryCache().findAll({ queryKey: queryKeys.space('deleted') })).toHaveLength(0);
  expect(client.getQueryData(queryKeys.accounts.list('other'))).toEqual(['account']);
  client.clear();
});
