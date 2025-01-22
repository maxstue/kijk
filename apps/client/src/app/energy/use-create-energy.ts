import { useMutation, useQueryClient } from '@tanstack/react-query';

import { EnergyFormSchema } from '@/app/energy/schemas';
import { createEnergy } from '@/shared/api/energy';
import { months } from '@/shared/types/app';

export const useCreateEnergy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { newEnergy: EnergyFormSchema }) => createEnergy(data.newEnergy),
    async onSuccess(_, variables) {
      await queryClient.invalidateQueries({
        queryKey: [
          'energies',
          'getBy',
          variables.newEnergy.date.getFullYear().toString(),
          months[variables.newEnergy.date.getMonth()],
        ],
      });
    },
  });
};
