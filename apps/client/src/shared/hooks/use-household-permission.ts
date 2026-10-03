import { useQuery } from '@tanstack/react-query';

import { hasHouseholdPermission } from '@/shared/api/households/permissions';
import type { HouseholdPermission } from '@/shared/api/households/permissions';
import { currentUserQueryOptions } from '@/shared/api/users/options';

/** Checks a permission in the current user's active household. */
export function useHouseholdPermission(permission: HouseholdPermission) {
  const { data } = useQuery(currentUserQueryOptions());
  const household = data?.user?.households?.find((entry) => entry.isActive);
  return hasHouseholdPermission(household, permission);
}
