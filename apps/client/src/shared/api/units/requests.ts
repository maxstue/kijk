import { apiClient } from '@/shared/lib/api-client';
import { ensureApiSuccess, unwrapApiResponse } from '@/shared/utils/http';

import type { CreateUnitData, UpdateUnitData } from './types';

export async function getUnits(includeArchived = false, signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient.GET('/api/units', { params: { query: { includeArchived } }, signal }));
}

export async function getSystemUnits(signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient.GET('/api/units/system', { signal }));
}

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

export async function createUnit(data: CreateUnitData) {
  return unwrapApiResponse(await apiClient.POST('/api/units', { body: data }));
}

export async function updateUnit(id: string, data: UpdateUnitData) {
  return unwrapApiResponse(await apiClient.PUT('/api/units/{id}', { body: data, params: { path: { id } } }));
}

export async function archiveUnit(id: string, restore = false) {
  return ensureApiSuccess(
    restore
      ? await apiClient.POST('/api/units/{id}/restore', { params: { path: { id } } })
      : await apiClient.POST('/api/units/{id}/archive', { params: { path: { id } } }),
  );
}

export async function deleteUnit(id: string) {
  return ensureApiSuccess(await apiClient.DELETE('/api/units/{id}', { params: { path: { id } } }));
}

export async function shareUnit(id: string, householdId: string) {
  return ensureApiSuccess(
    await apiClient.PUT('/api/units/{id}/households/{householdId}', {
      params: { path: { householdId, id } },
    }),
  );
}

export async function unshareUnit(id: string, householdId: string) {
  return ensureApiSuccess(
    await apiClient.DELETE('/api/units/{id}/households/{householdId}', {
      params: { path: { householdId, id } },
    }),
  );
}
