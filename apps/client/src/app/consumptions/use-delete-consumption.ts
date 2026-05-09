import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteConsumptionMutationOptions } from '@/shared/api/consumptions/options';
import { queryKeys } from '@/shared/api/query-keys';

export const useDeleteConsumption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...deleteConsumptionMutationOptions(),
    async onSuccess(_, variables) {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.consumptions.by(variables.year?.toString(), variables.month),
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.consumptions.statsAll() });
    },
  });
};
