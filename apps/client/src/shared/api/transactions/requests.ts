import { apiClient } from '@/shared/lib/api-client';
import { ensureApiSuccess, unwrapApiResponse } from '@/shared/utils/http';

import type {
  CategorizeTransactionData,
  CategorizeTransactionsRequest,
  CreateTransactionRequest,
  TransactionFilters,
  UpdateTransactionData,
} from './types';

/** Loads the transactions of the active household, newest first. */
export async function getTransactions(filters: TransactionFilters, signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient.GET('/api/transactions', { params: { query: filters }, signal }));
}

/** Records a transaction manually. */
export async function createTransaction(data: CreateTransactionRequest, signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient.POST('/api/transactions', { body: data, signal }));
}

/** Updates a transaction. A changed category counts as set manually. */
export async function updateTransaction(data: UpdateTransactionData, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient.PUT('/api/transactions/{id}', {
      body: data.transaction,
      params: { path: { id: data.id } },
      signal,
    }),
  );
}

/** Deletes a transaction. */
export async function deleteTransaction(id: string, signal?: AbortSignal) {
  return ensureApiSuccess(await apiClient.DELETE('/api/transactions/{id}', { params: { path: { id } }, signal }));
}

/** Corrects the category, optionally remembering it for the merchant or counterparty. */
export async function categorizeTransaction(data: CategorizeTransactionData) {
  return unwrapApiResponse(
    await apiClient.PUT('/api/transactions/{id}/category', {
      body: data.correction,
      params: { path: { id: data.id } },
    }),
  );
}

/** Assigns one category to several transactions; it counts as set by hand. */
export async function categorizeTransactions(data: CategorizeTransactionsRequest) {
  return unwrapApiResponse(await apiClient.PUT('/api/transactions/category', { body: data }));
}
