import { useQuery } from '@tanstack/react-query';

import { hasSpacePermission } from '@/shared/api/spaces/permissions';
import type { SpacePermission } from '@/shared/api/spaces/permissions';
import { currentUserQueryOptions } from '@/shared/api/users/options';

/** Checks a permission in the current user's active space. */
export function useSpacePermission(permission: SpacePermission) {
  const { data } = useQuery(currentUserQueryOptions());
  const space = data?.user?.spaces?.find((entry) => entry.isActive);
  return hasSpacePermission(space, permission);
}
