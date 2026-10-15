import { queryKeys } from '@kijk/api/query-keys';
import type { QueryClient } from '@tanstack/react-query';

/** Cancels requests and removes data that may belong to a deleted or previously active space. */
export async function clearSpaceData(queryClient: QueryClient) {
  const roots = [
    queryKeys.resources.all,
    queryKeys.consumptions.all,
    queryKeys.limits.all,
    queryKeys.units.all,
    queryKeys.spaces.all,
  ];
  await Promise.all(roots.map((queryKey) => queryClient.cancelQueries({ queryKey })));
  for (const queryKey of roots) {
    queryClient.removeQueries({ queryKey });
  }
}
