import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/query-keys';

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
  });

/** Mutation that deletes a space. */
export const deleteSpaceMutationOptions = () => mutationOptions({ mutationFn: (id: string) => deleteSpace(id) });

/** Mutation that changes another member's role. */
export const changeSpaceMemberRoleMutationOptions = () =>
  mutationOptions({
    mutationFn: ({ spaceId, roleId, userId }: { spaceId: string; roleId: string; userId: string }) =>
      changeSpaceMemberRole(spaceId, userId, roleId),
  });
