import { apiClient } from '@kijk/api/client';
import { type CsvDownload, toCsvDownload } from '@kijk/api/download';
import {
  transactionsCategorize,
  transactionsCategorizeMany,
  transactionsDelete,
  transactionsExport,
  transactionsList,
  transactionsRecord,
  transactionsUpdate,
} from '@kijk/api/generated/sdk';

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
  return transactionsList({ client: apiClient(), path: { spaceId }, query, signal });
}

/** Records a transaction manually. */
export async function record(spaceId: string, data: CreateTransactionRequest, signal?: AbortSignal) {
  return transactionsRecord({ client: apiClient(), path: { spaceId }, body: data, signal });
}

/** Updates a transaction. A changed category counts as set manually. */
export async function update(spaceId: string, data: UpdateTransactionData, signal?: AbortSignal) {
  return transactionsUpdate({ client: apiClient(), body: data.transaction, path: { spaceId, id: data.id }, signal });
}

/** Deletes a transaction. */
export async function remove(spaceId: string, id: string, signal?: AbortSignal) {
  await transactionsDelete({ client: apiClient(), path: { spaceId, id }, signal });
}

/** Corrects the category, optionally remembering it for the merchant or counterparty. */
export async function categorize(spaceId: string, data: CategorizeTransactionData) {
  return transactionsCategorize({ client: apiClient(), body: data.correction, path: { spaceId, id: data.id } });
}

/** Assigns one category to several transactions; it counts as set by hand. */
export async function categorizeMany(spaceId: string, data: CategorizeTransactionsRequest) {
  return transactionsCategorizeMany({ client: apiClient(), path: { spaceId }, body: data });
}

/** Exports the transactions matching the filters as CSV. */
export async function exportCsv(
  spaceId: string,
  filters: TransactionFilters,
  signal?: AbortSignal,
): Promise<CsvDownload> {
  const result = await transactionsExport({
    client: apiClient(),
    path: { spaceId },
    query: filters,
    throwOnError: false,
    signal,
  });

  return toCsvDownload(result, 'transactions.csv');
}
