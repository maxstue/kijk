import { keepPreviousData, mutationOptions, queryOptions } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/query-keys';

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
  });

/** Mutation that updates a transaction. */
export const updateTransactionMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: UpdateTransactionData) => updateTransaction(data),
  });

/** Mutation that deletes a transaction. */
export const deleteTransactionMutationOptions = () =>
  mutationOptions({
    mutationFn: (id: string) => deleteTransaction(id),
  });

/** Mutation that corrects the category of a transaction. */
export const categorizeTransactionMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: CategorizeTransactionData) => categorizeTransaction(data),
  });

/** Mutation that assigns one category to several transactions. */
export const categorizeTransactionsMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: CategorizeTransactionsRequest) => categorizeTransactions(data),
  });
