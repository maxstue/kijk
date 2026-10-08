import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/query-keys';

import {
  changeHouseholdMemberRole,
  deleteHousehold,
  getHouseholdMembers,
  getHouseholdRoles,
  updateHousehold,
} from './requests';
import type { UpdateHouseholdData } from './types';

/** Query for the fixed household roles; never stale. */
export const householdRolesQueryOptions = () =>
  queryOptions({
    queryFn: ({ signal }) => getHouseholdRoles(signal),
    queryKey: queryKeys.households.roles(),
    staleTime: Infinity,
  });

/** Query for the members of a household. */
export const householdMembersQueryOptions = (householdId: string) =>
  queryOptions({
    queryFn: ({ signal }) => getHouseholdMembers(householdId, signal),
    queryKey: queryKeys.households.members(householdId),
  });

/** Mutation that updates household details. */
export const updateHouseholdMutationOptions = () =>
  mutationOptions({
    mutationFn: ({ data, id }: { data: UpdateHouseholdData; id: string }) => updateHousehold(id, data),
  });

/** Mutation that deletes a household. */
export const deleteHouseholdMutationOptions = () =>
  mutationOptions({ mutationFn: (id: string) => deleteHousehold(id) });

/** Mutation that changes another member's role. */
export const changeHouseholdMemberRoleMutationOptions = () =>
  mutationOptions({
    mutationFn: ({ householdId, roleId, userId }: { householdId: string; roleId: string; userId: string }) =>
      changeHouseholdMemberRole(householdId, userId, roleId),
  });
