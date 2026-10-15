import { invalidate } from '@kijk/api/cache';
import { queryKeys } from '@kijk/api/query-keys';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { createCategory, deleteCategory, getCategories, updateCategory } from './requests';
import type { CreateCategoryRequest, UpdateCategoryRequest } from './types';

/** Query for the categories available to the active space. */
export const categoriesQueryOptions = (spaceId: string) =>
  queryOptions({
    queryFn: ({ signal }) => getCategories(spaceId, signal),
    queryKey: queryKeys.categories.list(spaceId),
  });

/** Mutation that creates a custom category. */
export const createCategoryMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: CreateCategoryRequest) => createCategory(spaceId, data),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.categories.all(spaceId)),
  });

/** Mutation that updates a custom category. */
export const updateCategoryMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: ({ data, id }: { data: UpdateCategoryRequest; id: string }) => updateCategory(spaceId, id, data),
    // Budgets, transactions and rules show category names and colors.
    onSuccess: (_data, _variables, _result, { client }) =>
      invalidate(
        client,
        queryKeys.categories.all(spaceId),
        queryKeys.budgets.all(spaceId),
        queryKeys.transactions.all(spaceId),
        queryKeys.categoryRules.all(spaceId),
      ),
  });

/** Mutation that deletes a custom category. */
export const deleteCategoryMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (id: string) => deleteCategory(spaceId, id),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.categories.all(spaceId)),
  });
