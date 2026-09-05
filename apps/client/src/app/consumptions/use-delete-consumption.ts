import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteConsumptionMutationOptions } from '@/shared/api/consumptions/options';
import { queryKeys } from '@/shared/api/query-keys';

export const useDeleteConsumption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...deleteConsumptionMutationOptions(),
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.consumptions.byAll(),
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.consumptions.statsAll() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.consumptionLimits.all }),
      ]);
    },
  });
};
