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
  TransactionFilters,
  UpdateTransactionData,
} from './types';

/** Query for the transactions matching the filters. */
export const transactionsQueryOptions = (filters: TransactionFilters) =>
  queryOptions({
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getTransactions(filters, signal),
    queryKey: queryKeys.transactions.list(filters),
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
