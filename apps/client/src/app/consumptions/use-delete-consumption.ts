import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { Months } from '@/shared/types/app';
import { deleteConsumption } from '@/shared/api/consumptions';

export const useDeleteConsumption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; year?: number; month?: Months }) => deleteConsumption(data.id),
    async onSuccess(_, variables) {
      await queryClient.invalidateQueries({
        queryKey: ['consumptions', 'usage', 'getBy', variables.year?.toString(), variables.month],
      });
      await queryClient.invalidateQueries({ queryKey: ['consumptions', 'stats'] });
    },
  });
};
