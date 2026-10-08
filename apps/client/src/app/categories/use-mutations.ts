import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createCategoryMutationOptions,
  deleteCategoryMutationOptions,
  updateCategoryMutationOptions,
} from '@/shared/api/categories/options';
import { deleteCategoryRuleMutationOptions } from '@/shared/api/category-rules/options';
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

/** Updates a custom category and refreshes every query that shows category names or colors. */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    ...updateCategoryMutationOptions(),
    async onSuccess() {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.categoryRules.all }),
      ]);
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

/** Deletes a remembered category correction and refreshes the rule queries. */
export function useDeleteCategoryRule() {
  const queryClient = useQueryClient();

  return useMutation({
    ...deleteCategoryRuleMutationOptions(),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: queryKeys.categoryRules.all });
    },
  });
}
