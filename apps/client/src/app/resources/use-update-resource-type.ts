import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ResourceFormValues } from './schemas';
import { updateResource } from '@/shared/api/resources';

export const useUpdateResource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; resourceType: ResourceFormValues }) => updateResource(data),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
};
