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

export const householdRolesQueryOptions = () =>
  queryOptions({
    queryFn: ({ signal }) => getHouseholdRoles(signal),
    queryKey: queryKeys.households.roles(),
    staleTime: Infinity,
  });

export const householdMembersQueryOptions = (householdId: string) =>
  queryOptions({
    queryFn: ({ signal }) => getHouseholdMembers(householdId, signal),
    queryKey: queryKeys.households.members(householdId),
  });

export const updateHouseholdMutationOptions = () =>
  mutationOptions({
    mutationFn: ({ data, id }: { data: UpdateHouseholdData; id: string }) => updateHousehold(id, data),
  });

export const deleteHouseholdMutationOptions = () =>
  mutationOptions({ mutationFn: (id: string) => deleteHousehold(id) });

export const changeHouseholdMemberRoleMutationOptions = () =>
  mutationOptions({
    mutationFn: ({ householdId, roleId, userId }: { householdId: string; roleId: string; userId: string }) =>
      changeHouseholdMemberRole(householdId, userId, roleId),
  });
