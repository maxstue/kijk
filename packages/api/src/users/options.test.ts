import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { expect, test, vi } from 'vite-plus/test';

import { queryKeys } from '../query-keys';
import { switchSpaceMutationOptions } from './options';
import { switchSpace } from './requests';
import type { CurrentUser } from './types';

vi.mock('./requests', { spy: true });

test('switching spaces reloads visible data in place and drops unused data of the previous space', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  const currentUser = { user: { id: 'user' } } as CurrentUser;
  const accountsFn = vi.fn().mockResolvedValue(['new-space-account']);
  client.setQueryData(queryKeys.accounts.list(), ['old-space-account']);
  client.setQueryData(queryKeys.budgets.list(), ['old-space-budget']);
  const observer = new QueryObserver(client, { queryKey: queryKeys.accounts.list(), queryFn: accountsFn });
  const unsubscribe = observer.subscribe(() => undefined);
  vi.mocked(switchSpace).mockResolvedValue(currentUser);

  await client.getMutationCache().build(client, switchSpaceMutationOptions()).execute('space');

  expect(client.getQueryData(queryKeys.users.me)).toBe(currentUser);
  expect(accountsFn).toHaveBeenCalledOnce();
  expect(observer.getCurrentResult().data).toEqual(['new-space-account']);
  expect(client.getQueryCache().find({ queryKey: queryKeys.budgets.list() })).toBeUndefined();
  unsubscribe();
  client.clear();
});
