import { hasSpacePermission } from '@kijk/api/spaces/permissions';
import type { SpacePermission } from '@kijk/api/spaces/permissions';

import { useActiveSpace } from '@/shared/hooks/use-active-space';

/** Checks a permission in the space in the URL. */
export function useSpacePermission(permission: SpacePermission) {
  return hasSpacePermission(useActiveSpace(), permission);
}
