import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteResource } from '@/shared/api/resources';

export const useDeleteResource = () => {
  const queryClient = useQueryClient();

  interface Data {
    id: string;
  }

  return useMutation({
    mutationFn: (data: Data) => deleteResource(data.id),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
};
