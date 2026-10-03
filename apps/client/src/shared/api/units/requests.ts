import { apiClient } from '@/shared/lib/api-client';
import { ensureApiSuccess, unwrapApiResponse } from '@/shared/utils/http';

import type { CreateUnitData, UpdateUnitData } from './types';

/** Loads all units visible to the user. */
export async function getUnits(includeArchived = false, signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient.GET('/api/units', { params: { query: { includeArchived } }, signal }));
}

/** Loads the system units. */
export async function getSystemUnits(signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient.GET('/api/units/system', { signal }));
}

/** Loads a page of the user's personal units or of a household's units. */
export async function getUnitPage(
  scope: 'household' | 'personal',
  householdId: string | undefined,
  page: number,
  pageSize: number,
  search: string,
  signal?: AbortSignal,
) {
  return unwrapApiResponse(
    await apiClient.GET('/api/units/page', {
      params: {
        query: {
          household: scope === 'household',
          ...(householdId ? { householdId } : {}),
          page,
          pageSize,
          ...(search ? { search } : {}),
        },
      },
      signal,
    }),
  );
}

/** Creates a unit owned by the user. */
export async function createUnit(data: CreateUnitData) {
  return unwrapApiResponse(await apiClient.POST('/api/units', { body: data }));
}

/** Updates a unit owned by the user. */
export async function updateUnit(id: string, data: UpdateUnitData) {
  return unwrapApiResponse(await apiClient.PUT('/api/units/{id}', { body: data, params: { path: { id } } }));
}

/** Archives a unit, or restores it when `restore` is true. */
export async function archiveUnit(id: string, restore = false) {
  return ensureApiSuccess(
    restore
      ? await apiClient.POST('/api/units/{id}/restore', { params: { path: { id } } })
      : await apiClient.POST('/api/units/{id}/archive', { params: { path: { id } } }),
  );
}

/** Deletes an unused, unshared unit. */
export async function deleteUnit(id: string) {
  return ensureApiSuccess(await apiClient.DELETE('/api/units/{id}', { params: { path: { id } } }));
}

/** Shares a unit with a household. */
export async function shareUnit(id: string, householdId: string) {
  return ensureApiSuccess(
    await apiClient.PUT('/api/units/{id}/households/{householdId}', {
      params: { path: { householdId, id } },
    }),
  );
}

/** Removes a unit from a household. */
export async function unshareUnit(id: string, householdId: string) {
  return ensureApiSuccess(
    await apiClient.DELETE('/api/units/{id}/households/{householdId}', {
      params: { path: { householdId, id } },
    }),
  );
}
