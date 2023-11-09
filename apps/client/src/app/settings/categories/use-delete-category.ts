import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { Id } from '@/types/app';

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  interface Data {
    categoryId: Id;
  }

  return useMutation({
    mutationFn: async (data: Data) => {
      return apiClient.delete({
        url: `categories/${data.categoryId}`,
      });
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};
