import { apiClient } from '@kijk/api/client';
import { unwrapApiResponse } from '@kijk/api/http';

import type { CreateAccountRequest, UpdateAccountRequest } from './types';

/** Loads the accounts of the active space. */
export async function getAccounts(signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient().GET('/api/accounts', { signal }));
}

/** Creates an account. */
export async function createAccount(data: CreateAccountRequest, signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient().POST('/api/accounts', { body: data, signal }));
}

/** Updates an account. */
export async function updateAccount(id: string, data: UpdateAccountRequest, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient().PUT('/api/accounts/{id}', { body: data, params: { path: { id } }, signal }),
  );
}

/** Deletes an account without transactions. */
export async function deleteAccount(id: string, signal?: AbortSignal) {
  await apiClient().DELETE('/api/accounts/{id}', { params: { path: { id } }, signal });
}
