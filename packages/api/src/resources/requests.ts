import { apiClient } from '@kijk/api/client';
import { unwrapApiResponse } from '@kijk/api/http';

import type { ResourceData, UpdateResourceData } from './types';

/** Loads the resources of the active space. */
export async function getResources(spaceId: string, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient().GET('/api/spaces/{spaceId}/resources', { params: { path: { spaceId } }, signal }),
  );
}

/** Loads a single resource. */
export async function getResource(spaceId: string, id: string, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient().GET('/api/spaces/{spaceId}/resources/{id}', {
      params: { path: { spaceId, id } },
      signal,
    }),
  );
}

/** Creates a custom resource. */
export async function createResource(spaceId: string, data: ResourceData, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient().POST('/api/spaces/{spaceId}/resources', { params: { path: { spaceId } }, body: data, signal }),
  );
}

/** Updates a custom resource. */
export async function updateResource(spaceId: string, data: UpdateResourceData, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient().PUT('/api/spaces/{spaceId}/resources/{id}', {
      body: data.resource,
      params: {
        path: { spaceId, id: data.id },
      },
      signal,
    }),
  );
}

/** Deletes an unused custom resource. */
export async function deleteResource(spaceId: string, id: string, signal?: AbortSignal) {
  await apiClient().DELETE('/api/spaces/{spaceId}/resources/{id}', {
    params: {
      path: { spaceId, id },
    },
    signal,
  });
}
