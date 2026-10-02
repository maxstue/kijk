import { apiClient } from '@/shared/lib/api-client';
import { unwrapApiResponse } from '@/shared/utils/http';

import type { CreateConsumptionLimitRequest, UpdateConsumptionLimitData } from './types';

/** Loads the limits of the active household with their current evaluation. */
export async function getConsumptionLimits(signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient.GET('/api/consumption-limits', { signal }));
}

/** Creates a limit and returns it with its evaluation. */
export async function createConsumptionLimit(data: CreateConsumptionLimitRequest, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient.POST('/api/consumption-limits', {
      body: data,
      signal,
    }),
  );
}

/** Updates a limit and returns it with its evaluation. */
export async function updateConsumptionLimit(data: UpdateConsumptionLimitData, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient.PUT('/api/consumption-limits/{id}', {
      body: data.limit,
      params: { path: { id: data.id } },
      signal,
    }),
  );
}
