import { useMutation } from '@tanstack/react-query';

import { EnergyFormSchema } from '@/app/energy/schemas';
import { updateEnergy } from '@/shared/api/energy';

interface Data {
  id: string;
  newEnergy: Partial<EnergyFormSchema>;
}

export const useUpdateTransaction = () => {
  return useMutation({
    mutationFn: (data: Data) => updateEnergy(data.id, data.newEnergy),
  });
};
