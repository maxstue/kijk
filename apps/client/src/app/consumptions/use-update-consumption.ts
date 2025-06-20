import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ConsumptionUpdateFormSchema } from '@/app/consumptions/schemas';
import type { Consumption } from '@/shared/types/app';
import { updateConsumption } from '@/shared/api/consumptions';
import { months } from '@/shared/types/app';

interface Data {
  id: string;
  consumption: ConsumptionUpdateFormSchema;
}

export const useUpdateConsumption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Data) => updateConsumption(data.id, data.consumption),
    onSuccess(data, variables) {
      const cachedConsumptionsUsage = queryClient.getQueryData<Array<Consumption>>([
        'consumptions',
        'usage',
        'getBy',
        variables.consumption.date.getFullYear().toString(),
        months[variables.consumption.date.getMonth()],
      ]);

      if (cachedConsumptionsUsage) {
        const newConsumptionsUsage = cachedConsumptionsUsage.map((consumption) =>
          consumption.id === data.id ? { ...consumption, ...data } : consumption,
        );
        queryClient.setQueryData(
          [
            'consumptions',
            'usage',
            'getBy',
            variables.consumption.date.getFullYear().toString(),
            months[variables.consumption.date.getMonth()],
          ],
          newConsumptionsUsage,
        );
      }
    },
  });
};
