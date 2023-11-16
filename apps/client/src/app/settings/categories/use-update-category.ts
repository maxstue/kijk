import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { Id } from '@/types/app';

import { CategoryFormValues } from './schemas';

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { categoryId: Id; category: CategoryFormValues }) => {
      return apiClient.put({
        url: `categories/${data.categoryId}`,
        data: data.category,
      });
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};
