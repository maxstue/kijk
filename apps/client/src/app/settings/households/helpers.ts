import type { QueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/query-keys';

/** Cancels requests and removes data that may belong to a deleted or previously active household. */
export async function clearHouseholdData(queryClient: QueryClient) {
  const roots = [
    queryKeys.resources.all,
    queryKeys.consumptions.all,
    queryKeys.consumptionLimits.all,
    queryKeys.units.all,
    queryKeys.households.all,
  ];
  await Promise.all(roots.map((queryKey) => queryClient.cancelQueries({ queryKey })));
  for (const queryKey of roots) {
    queryClient.removeQueries({ queryKey });
  }
}
