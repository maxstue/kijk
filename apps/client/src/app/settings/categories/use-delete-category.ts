import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteCategory } from '@/shared/api/categories';
import type { Id } from '@/shared/types/app';

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  interface Data {
    categoryId: Id;
  }

  return useMutation({
    mutationFn: (data: Data) => deleteCategory(data.categoryId),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};
