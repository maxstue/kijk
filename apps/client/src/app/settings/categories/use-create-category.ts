import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createCategory } from '@/shared/api/categories';
import type { ApiError, Category } from '@/shared/types/app';
import type { CategoryFormValues } from './schemas';

interface Options {
  category: CategoryFormValues;
}

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<Category, ApiError, Options>({
    mutationFn: (data: Options) => createCategory(data.category),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};
