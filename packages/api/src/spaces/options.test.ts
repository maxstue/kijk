import { QueryClient } from '@tanstack/react-query';
import { expect, test, vi } from 'vite-plus/test';

import { queryKeys } from '../query-keys';
import {
  createInvitationMutationOptions,
  createMutationOptions,
  deleteMutationOptions,
  revokeInvitationMutationOptions,
} from './options';
import { create, createInvitation, remove, revokeInvitation } from './requests';

vi.mock('./requests', { spy: true });

test('deleting a space drops its cached data and keeps the other spaces', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData(queryKeys.accounts.list('deleted'), ['account']);
  client.setQueryData(queryKeys.spaces.members('deleted'), ['member']);
  client.setQueryData(queryKeys.accounts.list('other'), ['account']);
  vi.mocked(remove).mockResolvedValue();

  await client.getMutationCache().build(client, deleteMutationOptions()).execute('deleted');

  expect(client.getQueryCache().findAll({ queryKey: queryKeys.space('deleted') })).toHaveLength(0);
  expect(client.getQueryData(queryKeys.accounts.list('other'))).toEqual(['account']);
  client.clear();
});

test('deleting a space cancels its in-flight requests before removing the cache', async () => {
  const client = new QueryClient();
  let requestSignal: AbortSignal | undefined;
  const request = client
    .query({
      queryKey: queryKeys.resources.list('deleted'),
      queryFn: ({ signal }) => {
        requestSignal = signal;
        return new Promise<string[]>(() => undefined);
      },
    })
    .catch(() => undefined);
  vi.mocked(remove).mockResolvedValue();
  await client.getMutationCache().build(client, deleteMutationOptions()).execute('deleted');
  await request;
  expect(requestSignal?.aborted).toBe(true);
  expect(client.getQueryState(queryKeys.resources.list('deleted'))).toBeUndefined();
  client.clear();
});

test('creating a space refetches the current user that lists the spaces', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData(queryKeys.users.me, { user: { spaces: [] } });
  vi.mocked(create).mockResolvedValue({ id: 'new' });

  const created = await client
    .getMutationCache()
    .build(client, createMutationOptions())
    .execute({ description: null, name: 'Holiday home' });

  expect(created).toEqual({ id: 'new' });
  expect(client.getQueryState(queryKeys.users.me)?.isInvalidated).toBe(true);
  client.clear();
});

test('inviting someone refetches the pending invitations of that space only', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData(queryKeys.spaces.invitations('family'), []);
  client.setQueryData(queryKeys.spaces.invitations('other'), []);
  vi.mocked(createInvitation).mockResolvedValue({
    createdAt: '2026-11-28T10:00:00Z',
    createdByName: 'Max',
    expiresAt: '2026-12-05T10:00:00Z',
    id: 'invitation',
    inviteeLabel: 'Anna#1234',
    roleId: 'member',
    roleName: 'Member',
  });

  await client
    .getMutationCache()
    .build(client, createInvitationMutationOptions())
    .execute({ spaceId: 'family', data: { email: null, roleId: null, uniqueName: 'Anna#1234' } });

  expect(createInvitation).toHaveBeenCalledWith('family', { email: null, roleId: null, uniqueName: 'Anna#1234' });
  expect(client.getQueryState(queryKeys.spaces.invitations('family'))?.isInvalidated).toBe(true);
  expect(client.getQueryState(queryKeys.spaces.invitations('other'))?.isInvalidated).toBe(false);
  client.clear();
});

test('revoking an invitation refetches the pending invitations', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData(queryKeys.spaces.invitations('family'), []);
  vi.mocked(revokeInvitation).mockResolvedValue();

  await client
    .getMutationCache()
    .build(client, revokeInvitationMutationOptions())
    .execute({ spaceId: 'family', invitationId: 'invitation' });

  expect(revokeInvitation).toHaveBeenCalledWith('family', 'invitation');
  expect(client.getQueryState(queryKeys.spaces.invitations('family'))?.isInvalidated).toBe(true);
  client.clear();
});
