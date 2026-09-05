import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateConsumptionMutationOptions } from '@/shared/api/consumptions/options';
import { queryKeys } from '@/shared/api/query-keys';
import type { Consumption } from '@/shared/types/domain';
import { getMonthFromDate } from '@/shared/utils/months';

export const useUpdateConsumption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    ...updateConsumptionMutationOptions(),
    async onSuccess(data, variables) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.consumptions.byAll() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.consumptionLimits.all }),
      ]);

      const consumptionDate = variables.consumption.date;
      if (!consumptionDate) {
        return;
      }

      const queryKey = queryKeys.consumptions.by(
        consumptionDate.getFullYear().toString(),
        getMonthFromDate(consumptionDate),
      );

      const cachedConsumptionsUsage = queryClient.getQueryData<Consumption[]>(queryKey);

      if (cachedConsumptionsUsage) {
        const newConsumptionsUsage = cachedConsumptionsUsage.map((consumption) =>
          consumption.id === data.id ? { ...consumption, ...data } : consumption,
        );
        queryClient.setQueryData(queryKey, newConsumptionsUsage);
      }
    },
  });
};
