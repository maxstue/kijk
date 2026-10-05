import { useQuery } from '@tanstack/react-query';

import { currentUserQueryOptions } from '@/shared/api/users/options';

/** Returns the current user's active space, or `undefined` while it is loading. */
export function useActiveSpace() {
  const { data } = useQuery(currentUserQueryOptions());
  return data?.user?.households?.find((entry) => entry.isActive);
}
