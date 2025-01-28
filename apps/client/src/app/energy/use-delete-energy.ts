import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteEnergy } from '@/shared/api/energy';
import { Months } from '@/shared/types/app';

export const useDeleteEnergy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; year?: number; month?: Months }) => deleteEnergy(data.id),
    async onSuccess(_, variables) {
      await queryClient.invalidateQueries({ queryKey: ['energies', 'getBy', variables.year, variables.month] });
      await queryClient.invalidateQueries({ queryKey: ['energies', 'stats'] });
    },
  });
};
