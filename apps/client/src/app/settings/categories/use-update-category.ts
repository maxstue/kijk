import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { Id } from '@/types/app';

import { CategoryFormValues } from './schemas';

export const useUpdateCategory = () => {
  const { getToken } = useKindeAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { categoryId: Id; category: CategoryFormValues }) => {
      return apiClient
        .put(`categories/${data.categoryId}`, {
          json: data.category,
          headers: { Authorization: `Bearer ${await getToken()}` },
        })
        .json();
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};
