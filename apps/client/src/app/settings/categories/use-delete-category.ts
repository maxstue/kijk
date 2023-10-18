import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { Id } from '@/types/app';

export const useDeleteCategory = () => {
  const { getToken } = useKindeAuth();
  const queryClient = useQueryClient();

  interface Data {
    categoryId: Id;
  }

  return useMutation({
    mutationFn: async (data: Data) => {
      return apiClient
        .delete(`categories/${data.categoryId}`, {
          headers: { Authorization: `Bearer ${await getToken()}` },
        })
        .json();
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};
