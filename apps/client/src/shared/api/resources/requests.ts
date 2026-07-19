import { apiClient } from '@/shared/lib/api-client';
import { ensureApiSuccess, unwrapApiResponse } from '@/shared/utils/http';

import type { ResourceData, UpdateResourceData } from './types';

export async function getResources(signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient.GET('/api/resources', { signal }));
}

export async function createResource(data: ResourceData, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient.POST('/api/resources', {
      body: data,
      signal,
    }),
  );
}

export async function updateResource(data: UpdateResourceData, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient.PUT('/api/resources/{id}', {
      body: data.resourceType,
      params: {
        path: { id: data.id },
      },
      signal,
    }),
  );
}

export async function deleteResource(id: string, signal?: AbortSignal) {
  return ensureApiSuccess(
    await apiClient.DELETE('/api/resources/{id}', {
      params: {
        path: { id },
      },
      signal,
    }),
  );
}
