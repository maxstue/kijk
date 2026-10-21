import { apiClient } from '@kijk/api/client';
import { type CsvDownload, toCsvDownload } from '@kijk/api/download';
import { unwrapApiResponse } from '@kijk/api/http';

import type {
  CategorizeTransactionData,
  CategorizeTransactionsRequest,
  CreateTransactionRequest,
  TransactionFilters,
  TransactionPageQuery,
  UpdateTransactionData,
} from './types';

/** Loads a page of the transactions of the active space, newest first. */
export async function list(spaceId: string, query: TransactionPageQuery, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient().GET('/api/spaces/{spaceId}/transactions', { params: { path: { spaceId }, query }, signal }),
  );
}

/** Records a transaction manually. */
export async function record(spaceId: string, data: CreateTransactionRequest, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient().POST('/api/spaces/{spaceId}/transactions', { params: { path: { spaceId } }, body: data, signal }),
  );
}

/** Updates a transaction. A changed category counts as set manually. */
export async function update(spaceId: string, data: UpdateTransactionData, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient().PUT('/api/spaces/{spaceId}/transactions/{id}', {
      body: data.transaction,
      params: { path: { spaceId, id: data.id } },
      signal,
    }),
  );
}

/** Deletes a transaction. */
export async function remove(spaceId: string, id: string, signal?: AbortSignal) {
  await apiClient().DELETE('/api/spaces/{spaceId}/transactions/{id}', { params: { path: { spaceId, id } }, signal });
}

/** Corrects the category, optionally remembering it for the merchant or counterparty. */
export async function categorize(spaceId: string, data: CategorizeTransactionData) {
  return unwrapApiResponse(
    await apiClient().PUT('/api/spaces/{spaceId}/transactions/{id}/category', {
      body: data.correction,
      params: { path: { spaceId, id: data.id } },
    }),
  );
}

/** Assigns one category to several transactions; it counts as set by hand. */
export async function categorizeMany(spaceId: string, data: CategorizeTransactionsRequest) {
  return unwrapApiResponse(
    await apiClient().PUT('/api/spaces/{spaceId}/transactions/category', { params: { path: { spaceId } }, body: data }),
  );
}

/** Exports the transactions matching the filters as CSV. */
export async function exportCsv(
  spaceId: string,
  filters: TransactionFilters,
  signal?: AbortSignal,
): Promise<CsvDownload> {
  const result = await apiClient().GET('/api/spaces/{spaceId}/transactions/export', {
    params: { path: { spaceId }, query: filters },
    parseAs: 'blob',
    signal,
  });

  return toCsvDownload(result, 'transactions.csv');
}
