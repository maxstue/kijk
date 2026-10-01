import { apiClient } from '@/shared/lib/api-client';
import { ensureApiSuccess, unwrapApiResponse } from '@/shared/utils/http';

import type { UpdateHouseholdData } from './types';

export async function updateHousehold(id: string, data: UpdateHouseholdData) {
  return ensureApiSuccess(await apiClient.PUT('/api/households/{id}', { body: data, params: { path: { id } } }));
}

export async function deleteHousehold(id: string) {
  return ensureApiSuccess(await apiClient.DELETE('/api/households/{id}', { params: { path: { id } } }));
}

export async function getHouseholdRoles(signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient.GET('/api/households/roles', { signal }));
}

export async function getHouseholdMembers(id: string, signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient.GET('/api/households/{id}/members', { params: { path: { id } }, signal }));
}

export async function changeHouseholdMemberRole(id: string, userId: string, roleId: string) {
  return unwrapApiResponse(
    await apiClient.PUT('/api/households/{id}/members/{userId}/role', {
      body: { roleId },
      params: { path: { id, userId } },
    }),
  );
}
