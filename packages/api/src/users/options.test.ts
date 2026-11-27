import { QueryClient } from '@tanstack/react-query';
import { expect, test, vi } from 'vite-plus/test';

import { queryKeys } from '../query-keys';
import {
  acceptInvitationMutationOptions,
  declineInvitationMutationOptions,
  setDefaultSpaceMutationOptions,
  updateMutationOptions,
} from './options';
import { acceptInvitation, declineInvitation, setDefaultSpace, update } from './requests';
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

test('accepting an invitation refreshes the inbox, the spaces of the user and the members of the joined space', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData(queryKeys.users.invitations, ['invitation']);
  client.setQueryData(queryKeys.users.me, { user: { id: 'user' } });
  client.setQueryData(queryKeys.spaces.members('family'), ['member']);
  client.setQueryData(queryKeys.spaces.members('other'), ['member']);
  vi.mocked(acceptInvitation).mockResolvedValue({ spaceId: 'family' });

  const result = await client.getMutationCache().build(client, acceptInvitationMutationOptions()).execute('invitation');

  expect(result).toEqual({ spaceId: 'family' });
  expect(acceptInvitation).toHaveBeenCalledWith('invitation');
  expect(client.getQueryState(queryKeys.users.invitations)?.isInvalidated).toBe(true);
  expect(client.getQueryState(queryKeys.users.me)?.isInvalidated).toBe(true);
  expect(client.getQueryState(queryKeys.spaces.members('family'))?.isInvalidated).toBe(true);
  expect(client.getQueryState(queryKeys.spaces.members('other'))?.isInvalidated).toBe(false);
  client.clear();
});

test('declining an invitation refreshes only the inbox', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData(queryKeys.users.invitations, ['invitation']);
  client.setQueryData(queryKeys.users.me, { user: { id: 'user' } });
  vi.mocked(declineInvitation).mockResolvedValue();

  await client.getMutationCache().build(client, declineInvitationMutationOptions()).execute('invitation');

  expect(declineInvitation).toHaveBeenCalledWith('invitation');
  expect(client.getQueryState(queryKeys.users.invitations)?.isInvalidated).toBe(true);
  expect(client.getQueryState(queryKeys.users.me)?.isInvalidated).toBe(false);
  client.clear();
});
