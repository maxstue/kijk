import { invalidate } from '@kijk/api/cache';
import { queryKeys } from '@kijk/api/query-keys';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { createCategory, deleteCategory, getCategories, updateCategory } from './requests';
import type { CreateCategoryRequest, UpdateCategoryRequest } from './types';

/** Query for the categories available to the active space. */
export const categoriesQueryOptions = () =>
  queryOptions({
    queryFn: ({ signal }) => getCategories(signal),
    queryKey: queryKeys.categories.list(),
  });

/** Mutation that creates a custom category. */
export const createCategoryMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: CreateCategoryRequest) => createCategory(data),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.categories.all),
  });

/** Mutation that updates a custom category. */
export const updateCategoryMutationOptions = () =>
  mutationOptions({
    mutationFn: ({ data, id }: { data: UpdateCategoryRequest; id: string }) => updateCategory(id, data),
    // Budgets, transactions and rules show category names and colors.
    onSuccess: (_data, _variables, _result, { client }) =>
      invalidate(
        client,
        queryKeys.categories.all,
        queryKeys.budgets.all,
        queryKeys.transactions.all,
        queryKeys.categoryRules.all,
      ),
  });

/** Mutation that deletes a custom category. */
export const deleteCategoryMutationOptions = () =>
  mutationOptions({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.categories.all),
  });
