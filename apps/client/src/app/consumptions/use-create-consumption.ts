import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createConsumptionMutationOptions } from '@/shared/api/consumptions/options';
import { queryKeys } from '@/shared/api/query-keys';
import type { Consumption } from '@/shared/types/domain';
import { months } from '@/shared/utils/months';

export const useCreateConsumption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...createConsumptionMutationOptions(),
    async onSuccess(data, variables) {
      const queryKey = queryKeys.consumptions.by(
        variables.date.getFullYear().toString(),
        months[variables.date.getMonth()],
      );

      const cachedConsumptionsUsage = queryClient.getQueryData<Consumption[]>(queryKey);

      if (cachedConsumptionsUsage) {
        const newConsumptionsUsage = [...cachedConsumptionsUsage, data];
        queryClient.setQueryData(queryKey, newConsumptionsUsage);
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.consumptions.statsAll() });
    },
  });
};
