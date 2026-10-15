import { invalidate } from '@kijk/api/cache';
import { queryKeys } from '@kijk/api/query-keys';
import { type QueryClient, keepPreviousData, mutationOptions, queryOptions } from '@tanstack/react-query';

import {
  categorizeTransaction,
  categorizeTransactions,
  createTransaction,
  deleteTransaction,
  getTransactions,
  updateTransaction,
} from './requests';
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
export const transactionsQueryOptions = (spaceId: string, query: TransactionPageQuery) =>
  queryOptions({
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getTransactions(spaceId, query, signal),
    queryKey: queryKeys.transactions.list(spaceId, query),
  });

/** Mutation that records a transaction. */
export const createTransactionMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: CreateTransactionRequest) => createTransaction(spaceId, data),
    onSuccess: (_data, _variables, _result, { client }) => invalidateFinances(client, spaceId),
  });

/** Mutation that updates a transaction. */
export const updateTransactionMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: UpdateTransactionData) => updateTransaction(spaceId, data),
    onSuccess: (_data, _variables, _result, { client }) => invalidateFinances(client, spaceId),
  });

/** Mutation that deletes a transaction. */
export const deleteTransactionMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (id: string) => deleteTransaction(spaceId, id),
    onSuccess: (_data, _variables, _result, { client }) => invalidateFinances(client, spaceId),
  });

/** Mutation that corrects the category of a transaction. */
export const categorizeTransactionMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: CategorizeTransactionData) => categorizeTransaction(spaceId, data),
    onSuccess: (_data, _variables, _result, { client }) => invalidateFinances(client, spaceId),
  });

/** Mutation that assigns one category to several transactions. */
export const categorizeTransactionsMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: CategorizeTransactionsRequest) => categorizeTransactions(spaceId, data),
    onSuccess: (_data, _variables, _result, { client }) => invalidateFinances(client, spaceId),
  });
