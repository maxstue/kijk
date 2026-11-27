import { invalidate } from '@kijk/api/cache';
import { queryKeys } from '@kijk/api/query-keys';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import {
  changeMemberRole,
  create,
  createInvitation,
  getInvitations,
  getMembers,
  getRoles,
  remove,
  revokeInvitation,
  update,
} from './requests';
import type { CreateSpaceData, CreateSpaceInvitationData, UpdateSpaceData } from './types';

/** Query for the fixed space roles; never stale. */
export const rolesQueryOptions = () =>
  queryOptions({
    queryFn: ({ signal }) => getRoles(signal),
    queryKey: queryKeys.spaces.roles(),
    staleTime: Infinity,
  });

/** Query for the members of a space. */
export const membersQueryOptions = (spaceId: string) =>
  queryOptions({
    queryFn: ({ signal }) => getMembers(spaceId, signal),
    queryKey: queryKeys.spaces.members(spaceId),
  });

/** Query for the pending invitations of a space; requires the `members:invite` permission. */
export const invitationsQueryOptions = (spaceId: string) =>
  queryOptions({
    queryFn: ({ signal }) => getInvitations(spaceId, signal),
    queryKey: queryKeys.spaces.invitations(spaceId),
  });

/** Mutation that creates a shared space; the current user, which lists the spaces, is refetched. */
export const createMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: CreateSpaceData) => create(data),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.users.me),
  });

/** Mutation that updates space details. */
export const updateMutationOptions = () =>
  mutationOptions({
    mutationFn: ({ data, id }: { data: UpdateSpaceData; id: string }) => update(id, data),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.users.me),
  });

/** Mutation that deletes a space and drops all its cached data. */
export const deleteMutationOptions = () =>
  mutationOptions({
    mutationFn: (id: string) => remove(id),
    onSuccess: async (_data, id, _result, { client }) => {
      await client.cancelQueries({ queryKey: queryKeys.space(id) });
      client.removeQueries({ queryKey: queryKeys.space(id) });
      await invalidate(client, queryKeys.users.me);
    },
  });

/** Mutation that changes another member's role. */
export const changeMemberRoleMutationOptions = () =>
  mutationOptions({
    mutationFn: ({ spaceId, roleId, userId }: { spaceId: string; roleId: string; userId: string }) =>
      changeMemberRole(spaceId, userId, roleId),
    onSuccess: (_data, { spaceId }, _result, { client }) => invalidate(client, queryKeys.spaces.members(spaceId)),
  });

/** Mutation that invites one person into a space; the pending invitations are refetched. */
export const createInvitationMutationOptions = () =>
  mutationOptions({
    mutationFn: ({ spaceId, data }: { spaceId: string; data: CreateSpaceInvitationData }) =>
      createInvitation(spaceId, data),
    onSuccess: (_data, { spaceId }, _result, { client }) => invalidate(client, queryKeys.spaces.invitations(spaceId)),
  });

/** Mutation that revokes a pending invitation; the pending invitations are refetched. */
export const revokeInvitationMutationOptions = () =>
  mutationOptions({
    mutationFn: ({ spaceId, invitationId }: { spaceId: string; invitationId: string }) =>
      revokeInvitation(spaceId, invitationId),
    onSuccess: (_data, { spaceId }, _result, { client }) => invalidate(client, queryKeys.spaces.invitations(spaceId)),
  });
