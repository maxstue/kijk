import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateCategory } from '@/shared/api/categories';
import type { CategoryFormValues } from './schemas';

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { categoryId: string; category: CategoryFormValues }) => updateCategory(data),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};
