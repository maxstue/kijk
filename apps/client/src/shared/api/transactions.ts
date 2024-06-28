import { apiClient } from '@/shared/lib/api-client';
import type { TransactionFormValues } from '@/app/budget/schemas';
import type { Years } from '@/app/budget/types';
import type { ApiResponse, Transaction } from '@/shared/types/app';

const ENDPOINT = 'transactions';

export function getYears(signal?: AbortSignal) {
  return apiClient.get<ApiResponse<Years>>({
    url: `${ENDPOINT}/years`,
    signal,
  });
}

/**
 * Get the list of transactions.
 *
 * If the year and month are provided, only the transactions for that month and year will be returned. If they are not
 * provided, all transactions will be returned. If only the year is provided, only the transactions for that year will
 * be returned.
 *
 * @param year The year of the transaction
 * @param month The month of the transaction
 * @param signal The ssignal
 * @returns The list of transactions
 */
export function getTransactionById(year?: string, month?: string, signal?: AbortSignal) {
  return apiClient.get<ApiResponse<Transaction[]>>({
    url: ENDPOINT,
    params: { year, month },
    signal,
  });
}

export function createTransaction(data: TransactionFormValues, signal?: AbortSignal) {
  return apiClient.post<ApiResponse<Transaction>>({
    url: ENDPOINT,
    data,
    signal,
  });
}

export function updateTransaction(transactionId: string, data: Partial<TransactionFormValues>, signal?: AbortSignal) {
  return apiClient.put<ApiResponse<Transaction>>({
    url: `${ENDPOINT}/${transactionId}`,
    data,
    signal,
  });
}

export function deleteTransaction(transactionId: string, signal?: AbortSignal) {
  return apiClient.delete<ApiResponse<Transaction>>({
    url: `${ENDPOINT}/${transactionId}`,
    signal,
  });
}
