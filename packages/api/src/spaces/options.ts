import { invalidate } from '@kijk/api/cache';
import { queryKeys } from '@kijk/api/query-keys';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { changeSpaceMemberRole, deleteSpace, getSpaceMembers, getSpaceRoles, updateSpace } from './requests';
import type { UpdateSpaceData } from './types';

/** Query for the fixed space roles; never stale. */
export const spaceRolesQueryOptions = () =>
  queryOptions({
    queryFn: ({ signal }) => getSpaceRoles(signal),
    queryKey: queryKeys.spaces.roles(),
    staleTime: Infinity,
  });

/** Query for the members of a space. */
export const spaceMembersQueryOptions = (spaceId: string) =>
  queryOptions({
    queryFn: ({ signal }) => getSpaceMembers(spaceId, signal),
    queryKey: queryKeys.spaces.members(spaceId),
  });

/** Mutation that updates space details. */
export const updateSpaceMutationOptions = () =>
  mutationOptions({
    mutationFn: ({ data, id }: { data: UpdateSpaceData; id: string }) => updateSpace(id, data),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.users.me),
  });

/** Mutation that deletes a space and drops all its cached data. */
export const deleteSpaceMutationOptions = () =>
  mutationOptions({
    mutationFn: (id: string) => deleteSpace(id),
    onSuccess: async (_data, id, _result, { client }) => {
      await client.cancelQueries({ queryKey: queryKeys.space(id) });
      client.removeQueries({ queryKey: queryKeys.space(id) });
      await invalidate(client, queryKeys.users.me);
    },
  });

/** Mutation that changes another member's role. */
export const changeSpaceMemberRoleMutationOptions = () =>
  mutationOptions({
    mutationFn: ({ spaceId, roleId, userId }: { spaceId: string; roleId: string; userId: string }) =>
      changeSpaceMemberRole(spaceId, userId, roleId),
    onSuccess: (_data, { spaceId }, _result, { client }) => invalidate(client, queryKeys.spaces.members(spaceId)),
  });
