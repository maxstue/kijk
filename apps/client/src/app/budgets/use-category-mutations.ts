import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createCategoryMutationOptions, deleteCategoryMutationOptions } from '@/shared/api/categories/options';
import { queryKeys } from '@/shared/api/query-keys';

/** Creates a custom category and refreshes the category queries. */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    ...createCategoryMutationOptions(),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

/** Deletes a custom category and refreshes the category queries. */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    ...deleteCategoryMutationOptions(),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}
