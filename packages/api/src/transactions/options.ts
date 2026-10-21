import { invalidate } from '@kijk/api/cache';
import { queryKeys } from '@kijk/api/query-keys';
import { type QueryClient, keepPreviousData, mutationOptions, queryOptions } from '@tanstack/react-query';

import { categorize, categorizeMany, record, remove, list, update } from './requests';
import type {
  CategorizeTransactionData,
  CategorizeTransactionsRequest,
  CreateTransactionRequest,
  TransactionPageQuery,
  UpdateTransactionData,
} from './types';

// Transactions feed the budget evaluations, and corrections change remembered rules and their suggestions.
const invalidateFinances = (client: QueryClient, spaceId: string) =>
  invalidate(
    client,
    queryKeys.transactions.all(spaceId),
    queryKeys.budgets.all(spaceId),
    queryKeys.categoryRules.all(spaceId),
  );

/** Query for a page of the transactions matching the filters. */
export const listQueryOptions = (spaceId: string, query: TransactionPageQuery) =>
  queryOptions({
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => list(spaceId, query, signal),
    queryKey: queryKeys.transactions.list(spaceId, query),
  });

/** Mutation that records a transaction. */
export const recordMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: CreateTransactionRequest) => record(spaceId, data),
    onSuccess: (_data, _variables, _result, { client }) => invalidateFinances(client, spaceId),
  });

/** Mutation that updates a transaction. */
export const updateMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: UpdateTransactionData) => update(spaceId, data),
    onSuccess: (_data, _variables, _result, { client }) => invalidateFinances(client, spaceId),
  });

/** Mutation that deletes a transaction. */
export const deleteMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (id: string) => remove(spaceId, id),
    onSuccess: (_data, _variables, _result, { client }) => invalidateFinances(client, spaceId),
  });

/** Mutation that corrects the category of a transaction. */
export const categorizeMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: CategorizeTransactionData) => categorize(spaceId, data),
    onSuccess: (_data, _variables, _result, { client }) => invalidateFinances(client, spaceId),
  });

/** Mutation that assigns one category to several transactions. */
export const categorizeManyMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: CategorizeTransactionsRequest) => categorizeMany(spaceId, data),
    onSuccess: (_data, _variables, _result, { client }) => invalidateFinances(client, spaceId),
  });
