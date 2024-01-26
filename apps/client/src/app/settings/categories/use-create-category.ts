import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createCategory } from '@/shared/api/categories';
import type { ApiError, ApiResponse, Category } from '@/shared/types/app';
import type { CategoryFormValues } from './schemas';

interface Options {
  category: CategoryFormValues;
}

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<Category>, ApiResponse<ApiError[]>, Options>({
    mutationFn: async (data: Options) => createCategory(data.category),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};
