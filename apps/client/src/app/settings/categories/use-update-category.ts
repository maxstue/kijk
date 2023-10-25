import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/api-client';
import { Id } from '@/types/app';

import { CategoryFormValues } from './schemas';

export const useUpdateCategory = () => {
  const { getToken } = useKindeAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { categoryId: Id; category: CategoryFormValues }) => {
      return apiClient.put({
        url: `categories/${data.categoryId}`,
        data: data.category,
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};
