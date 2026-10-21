import { apiClient } from '@kijk/api/client';
import { unwrapApiResponse } from '@kijk/api/http';

import type { CreateAccountRequest, UpdateAccountRequest } from './types';

/** Loads the accounts of the active space. */
export async function list(spaceId: string, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient().GET('/api/spaces/{spaceId}/accounts', { params: { path: { spaceId } }, signal }),
  );
}

/** Creates an account. */
export async function create(spaceId: string, data: CreateAccountRequest, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient().POST('/api/spaces/{spaceId}/accounts', { params: { path: { spaceId } }, body: data, signal }),
  );
}

/** Updates an account. */
export async function update(spaceId: string, id: string, data: UpdateAccountRequest, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient().PUT('/api/spaces/{spaceId}/accounts/{id}', {
      body: data,
      params: { path: { spaceId, id } },
      signal,
    }),
  );
}

/** Deletes an account without transactions. */
export async function remove(spaceId: string, id: string, signal?: AbortSignal) {
  await apiClient().DELETE('/api/spaces/{spaceId}/accounts/{id}', { params: { path: { spaceId, id } }, signal });
}
