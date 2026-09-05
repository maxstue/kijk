import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createConsumptionLimitMutationOptions } from '@/shared/api/consumption-limits/options';
import { queryKeys } from '@/shared/api/query-keys';

export function useCreateConsumptionLimit() {
  const queryClient = useQueryClient();

  return useMutation({
    ...createConsumptionLimitMutationOptions(),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: queryKeys.consumptionLimits.all });
    },
  });
}
