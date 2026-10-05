import { apiClient } from '@/shared/lib/api-client';
import { ensureApiSuccess, unwrapApiResponse } from '@/shared/utils/http';

import type { UpdateSpaceData } from './types';

/** Updates the details of a space. */
export async function updateSpace(id: string, data: UpdateSpaceData) {
  return ensureApiSuccess(await apiClient.PUT('/api/spaces/{id}', { body: data, params: { path: { id } } }));
}

/** Deletes a space and all of its data. */
export async function deleteSpace(id: string) {
  return ensureApiSuccess(await apiClient.DELETE('/api/spaces/{id}', { params: { path: { id } } }));
}

/** Loads the space roles and their permissions. */
export async function getSpaceRoles(signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient.GET('/api/spaces/roles', { signal }));
}

/** Loads the members of a space with their roles. */
export async function getSpaceMembers(id: string, signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient.GET('/api/spaces/{id}/members', { params: { path: { id } }, signal }));
}

/** Changes the role of another space member and returns the updated member. */
export async function changeSpaceMemberRole(id: string, userId: string, roleId: string) {
  return unwrapApiResponse(
    await apiClient.PUT('/api/spaces/{id}/members/{userId}/role', {
      body: { roleId },
      params: { path: { id, userId } },
    }),
  );
}
