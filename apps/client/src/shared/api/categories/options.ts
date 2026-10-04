import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/query-keys';

import { createCategory, deleteCategory, getCategories } from './requests';
import type { CreateCategoryRequest } from './types';

/** Query for the categories available to the active household. */
export const categoriesQueryOptions = () =>
  queryOptions({
    queryFn: ({ signal }) => getCategories(signal),
    queryKey: queryKeys.categories.list(),
  });

/** Mutation that creates a custom category. */
export const createCategoryMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: CreateCategoryRequest) => createCategory(data),
  });

/** Mutation that deletes a custom category. */
export const deleteCategoryMutationOptions = () =>
  mutationOptions({
    mutationFn: (id: string) => deleteCategory(id),
  });
