import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateConsumptionLimitMutationOptions } from '@/shared/api/consumption-limits/options';
import { queryKeys } from '@/shared/api/query-keys';

/** Updates a limit and refreshes the limit queries. */
export function useUpdateConsumptionLimit() {
  const queryClient = useQueryClient();

  return useMutation({
    ...updateConsumptionLimitMutationOptions(),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: queryKeys.consumptionLimits.all });
    },
  });
}
