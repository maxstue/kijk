import { apiClient } from '@kijk/api/client';
import { unwrapApiResponse } from '@kijk/api/http';

import type { CreateLimitRequest, UpdateLimitData } from './types';

/** Loads the limits of the active space with their current evaluation. */
export async function list(spaceId: string, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient().GET('/api/spaces/{spaceId}/limits', { params: { path: { spaceId } }, signal }),
  );
}

/** Creates a limit and returns it with its evaluation. */
export async function create(spaceId: string, data: CreateLimitRequest, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient().POST('/api/spaces/{spaceId}/limits', { params: { path: { spaceId } }, body: data, signal }),
  );
}

/** Updates a limit and returns it with its evaluation. */
export async function update(spaceId: string, data: UpdateLimitData, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient().PUT('/api/spaces/{spaceId}/limits/{id}', {
      body: data.limit,
      params: { path: { spaceId, id: data.id } },
      signal,
    }),
  );
}

/** Deletes a limit of the active space. */
export async function remove(spaceId: string, id: string, signal?: AbortSignal) {
  await apiClient().DELETE('/api/spaces/{spaceId}/limits/{id}', {
    params: { path: { spaceId, id } },
    signal,
  });
}
