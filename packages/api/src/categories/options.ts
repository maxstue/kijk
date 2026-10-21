import { invalidate } from '@kijk/api/cache';
import { queryKeys } from '@kijk/api/query-keys';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { create, remove, list, update } from './requests';
import type { CreateCategoryRequest, UpdateCategoryRequest } from './types';

/** Query for the categories available to the active space. */
export const listQueryOptions = (spaceId: string) =>
  queryOptions({
    queryFn: ({ signal }) => list(spaceId, signal),
    queryKey: queryKeys.categories.list(spaceId),
  });

/** Mutation that creates a custom category. */
export const createMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: CreateCategoryRequest) => create(spaceId, data),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.categories.all(spaceId)),
  });

/** Mutation that updates a custom category. */
export const updateMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: ({ data, id }: { data: UpdateCategoryRequest; id: string }) => update(spaceId, id, data),
    // Budgets, transactions and rules show category names and colors.
    onSuccess: (_data, _variables, _result, { client }) =>
      invalidate(
        client,
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
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.categories.all(spaceId)),
  });
