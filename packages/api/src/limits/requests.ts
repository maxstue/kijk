import { apiClient } from '@kijk/api/client';
import { limitsCreate, limitsDelete, limitsList, limitsUpdate } from '@kijk/api/generated/sdk';

import type { CreateLimitRequest, UpdateLimitData } from './types';

/** Loads the limits of the active space with their current evaluation. */
export async function list(spaceId: string, signal?: AbortSignal) {
  return limitsList({ client: apiClient(), path: { spaceId }, signal });
}

/** Creates a limit and returns it with its evaluation. */
export async function create(spaceId: string, data: CreateLimitRequest, signal?: AbortSignal) {
  return limitsCreate({ client: apiClient(), path: { spaceId }, body: data, signal });
}

/** Updates a limit and returns it with its evaluation. */
export async function update(spaceId: string, data: UpdateLimitData, signal?: AbortSignal) {
  return limitsUpdate({ client: apiClient(), body: data.limit, path: { spaceId, id: data.id }, signal });
}

/** Deletes a limit of the active space. */
export async function remove(spaceId: string, id: string, signal?: AbortSignal) {
  await limitsDelete({ client: apiClient(), path: { spaceId, id }, signal });
}
