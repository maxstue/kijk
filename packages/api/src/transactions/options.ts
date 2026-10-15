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
const invalidateFinances = (client: QueryClient) =>
  invalidate(client, queryKeys.transactions.all, queryKeys.budgets.all, queryKeys.categoryRules.all);

/** Query for a page of the transactions matching the filters. */
export const transactionsQueryOptions = (query: TransactionPageQuery) =>
  queryOptions({
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getTransactions(query, signal),
    queryKey: queryKeys.transactions.list(query),
  });

/** Mutation that records a transaction. */
export const createTransactionMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: CreateTransactionRequest) => createTransaction(data),
    onSuccess: (_data, _variables, _result, { client }) => invalidateFinances(client),
  });

/** Mutation that updates a transaction. */
export const updateTransactionMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: UpdateTransactionData) => updateTransaction(data),
    onSuccess: (_data, _variables, _result, { client }) => invalidateFinances(client),
  });

/** Mutation that deletes a transaction. */
export const deleteTransactionMutationOptions = () =>
  mutationOptions({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: (_data, _variables, _result, { client }) => invalidateFinances(client),
  });

/** Mutation that corrects the category of a transaction. */
export const categorizeTransactionMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: CategorizeTransactionData) => categorizeTransaction(data),
    onSuccess: (_data, _variables, _result, { client }) => invalidateFinances(client),
  });

/** Mutation that assigns one category to several transactions. */
export const categorizeTransactionsMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: CategorizeTransactionsRequest) => categorizeTransactions(data),
    onSuccess: (_data, _variables, _result, { client }) => invalidateFinances(client),
  });
