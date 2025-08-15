import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ConsumptionCreateFormSchema } from '@/app/consumptions/schemas';
import type { Consumption } from '@/shared/types/app';
import { createConsumption } from '@/shared/api/consumptions';
import { months } from '@/shared/types/app';

export const useCreateConsumption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { newEnergy: ConsumptionCreateFormSchema }) => createConsumption(data.newEnergy),
    async onSuccess(data, variables) {
      const cachedConsumptionsUsage = queryClient.getQueryData<Array<Consumption>>([
        'consumptions',
        'usage',
        'getBy',
        variables.newEnergy.date.getFullYear().toString(),
        months[variables.newEnergy.date.getMonth()],
      ]);

      if (cachedConsumptionsUsage) {
        const newConsumptionsUsage = [...cachedConsumptionsUsage, data];
        queryClient.setQueryData(
          [
            'consumptions',
            'usage',
            'getBy',
            variables.newEnergy.date.getFullYear().toString(),
            months[variables.newEnergy.date.getMonth()],
          ],
          newConsumptionsUsage,
        );
      }
      await queryClient.invalidateQueries({ queryKey: ['consumptions', 'stats'] });
    },
  });
};
