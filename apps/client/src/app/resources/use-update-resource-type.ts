import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateResource } from '@/shared/api/resources';

import type { ResourceFormValues } from './schemas';

export const useUpdateResource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; resourceType: ResourceFormValues }) => updateResource(data),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
};
