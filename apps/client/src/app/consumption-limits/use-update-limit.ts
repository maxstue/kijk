import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateConsumptionLimitMutationOptions } from '@/shared/api/consumption-limits/options';
import { queryKeys } from '@/shared/api/query-keys';

export function useUpdateConsumptionLimit() {
  const queryClient = useQueryClient();

  return useMutation({
    ...updateConsumptionLimitMutationOptions(),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: queryKeys.consumptionLimits.all });
    },
  });
}
