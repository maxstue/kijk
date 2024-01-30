import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateCategory } from '@/shared/api/categories';
import type { Id } from '@/shared/types/app';
import type { CategoryFormValues } from './schemas';

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { categoryId: Id; category: CategoryFormValues }) => updateCategory(data),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};
