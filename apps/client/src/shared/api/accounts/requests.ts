import { apiClient } from '@/shared/lib/api-client';
import { ensureApiSuccess, unwrapApiResponse } from '@/shared/utils/http';

import type { CreateAccountRequest } from './types';

/** Loads the accounts of the active household. */
export async function getAccounts(signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient.GET('/api/accounts', { signal }));
}

/** Creates an account. */
export async function createAccount(data: CreateAccountRequest, signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient.POST('/api/accounts', { body: data, signal }));
}

/** Deletes an account without transactions. */
export async function deleteAccount(id: string, signal?: AbortSignal) {
  return ensureApiSuccess(await apiClient.DELETE('/api/accounts/{id}', { params: { path: { id } }, signal }));
}
