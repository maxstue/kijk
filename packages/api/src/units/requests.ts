import { apiClient } from '@kijk/api/client';
import { unwrapApiResponse } from '@kijk/api/http';

import type { CreateUnitData, UnitListQuery, UpdateUnitData } from './types';

/** Loads the units of a scope, optionally filtered and paged. */
export async function list(query: UnitListQuery, signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient().GET('/api/units', { params: { query }, signal }));
}

/** Creates a unit owned by the user. */
export async function create(data: CreateUnitData) {
  return unwrapApiResponse(await apiClient().POST('/api/units', { body: data }));
}

/** Updates a unit owned by the user. */
export async function update(id: string, data: UpdateUnitData) {
  return unwrapApiResponse(await apiClient().PUT('/api/units/{id}', { body: data, params: { path: { id } } }));
}

/** Archives a unit. */
export async function archive(id: string) {
  await apiClient().POST('/api/units/{id}/archive', { params: { path: { id } } });
}

/** Restores an archived unit. */
export async function restore(id: string) {
  await apiClient().POST('/api/units/{id}/restore', { params: { path: { id } } });
}

/** Deletes an unused, unshared unit. */
export async function remove(id: string) {
  await apiClient().DELETE('/api/units/{id}', { params: { path: { id } } });
}

/** Shares a unit with a space. */
export async function shareWithSpace(id: string, spaceId: string) {
  await apiClient().PUT('/api/units/{id}/spaces/{spaceId}', {
    params: { path: { spaceId, id } },
  });
}

/** Removes a unit from a space. */
export async function removeFromSpace(id: string, spaceId: string) {
  await apiClient().DELETE('/api/units/{id}/spaces/{spaceId}', {
    params: { path: { spaceId, id } },
  });
}
