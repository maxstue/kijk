import { invalidate } from '@kijk/api/cache';
import { keepPreviousPageInSpace } from '@kijk/api/paging';
import type { ListQuery } from '@kijk/api/paging';
import { queryKeys } from '@kijk/api/query-keys';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { create, remove, list, update } from './requests';
import type { CategoryPage, CategorySort, CreateCategoryRequest, UpdateCategoryRequest } from './types';

/**
 * Query for the categories available to the active space. Tables pass a search, sort and page; selects omit the query
 * to get every row.
 */
export const listQueryOptions = (spaceId: string, query: ListQuery<CategorySort> = {}) =>
  queryOptions({
    placeholderData: keepPreviousPageInSpace<CategoryPage>(spaceId),
    queryFn: ({ signal }) => list(spaceId, query, signal),
    queryKey: queryKeys.categories.list(spaceId, query),
  });

/** Mutation that creates a custom category. */
export const createMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: CreateCategoryRequest) => create(spaceId, data),
    onSuccess: (_data, _variables, _result, { client }) =>
      invalidate(client, queryKeys.dashboard.all(spaceId), queryKeys.categories.all(spaceId)),
  });

/** Mutation that updates a custom category. */
export const updateMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: ({ data, id }: { data: UpdateCategoryRequest; id: string }) => update(spaceId, id, data),
    // Budgets, transactions and rules show category names and colors.
    onSuccess: (_data, _variables, _result, { client }) =>
      invalidate(
        client,
        queryKeys.dashboard.all(spaceId),
        queryKeys.categories.all(spaceId),
        queryKeys.budgets.all(spaceId),
        queryKeys.transactions.all(spaceId),
        queryKeys.categoryRules.all(spaceId),
        queryKeys.imports.all(spaceId),
      ),
  });

/** Mutation that deletes a custom category. */
export const deleteMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (id: string) => remove(spaceId, id),
    onSuccess: (_data, _variables, _result, { client }) =>
      invalidate(client, queryKeys.dashboard.all(spaceId), queryKeys.categories.all(spaceId)),
  });
