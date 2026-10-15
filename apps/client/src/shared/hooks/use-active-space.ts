import { currentUserQueryOptions } from '@kijk/api/users/options';
import { useQuery } from '@tanstack/react-query';

/** Returns the current user's active space, or `undefined` while it is loading. */
export function useActiveSpace() {
  const { data } = useQuery(currentUserQueryOptions());
  return data?.user?.spaces?.find((entry) => entry.isActive);
}
