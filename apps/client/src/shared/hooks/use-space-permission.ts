import { hasSpacePermission } from '@kijk/api/spaces/permissions';
import type { SpacePermission } from '@kijk/api/spaces/permissions';
import { currentUserQueryOptions } from '@kijk/api/users/options';
import { useQuery } from '@tanstack/react-query';

/** Checks a permission in the current user's active space. */
export function useSpacePermission(permission: SpacePermission) {
  const { data } = useQuery(currentUserQueryOptions());
  const space = data?.user?.spaces?.find((entry) => entry.isActive);
  return hasSpacePermission(space, permission);
}
