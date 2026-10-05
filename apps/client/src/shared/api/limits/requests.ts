import { apiClient } from '@/shared/lib/api-client';
import { unwrapApiResponse } from '@/shared/utils/http';

import type { CreateLimitRequest, UpdateLimitData } from './types';

/** Loads the limits of the active household with their current evaluation. */
export async function getLimits(signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient.GET('/api/limits', { signal }));
}

/** Creates a limit and returns it with its evaluation. */
export async function createLimit(data: CreateLimitRequest, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient.POST('/api/limits', {
      body: data,
      signal,
    }),
  );
}

/** Updates a limit and returns it with its evaluation. */
export async function updateLimit(data: UpdateLimitData, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient.PUT('/api/limits/{id}', {
      body: data.limit,
      params: { path: { id: data.id } },
      signal,
    }),
  );
}
