import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteCategory } from '@/shared/api/categories';

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  interface Data {
    categoryId: string;
  }

  return useMutation({
    mutationFn: (data: Data) => deleteCategory(data.categoryId),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};
