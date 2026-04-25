import type { ResourceFormValues } from '@/app/resources/schemas';
import { apiClient, unwrapApiResponse } from '@/shared/lib/api-client';

export function getResources(signal?: AbortSignal) {
  return apiClient.GET('/api/resources', { signal }).then((response) => unwrapApiResponse(response));
}

export function createResource(data: ResourceFormValues, signal?: AbortSignal) {
  return apiClient
    .POST('/api/resources', {
      body: data,
      signal,
    })
    .then((response) => unwrapApiResponse(response));
}

export function updateResource(data: { id: string; resourceType: ResourceFormValues }, signal?: AbortSignal) {
  return apiClient
    .PUT('/api/resources/{id}', {
      body: data.resourceType,
      params: {
        path: { id: data.id },
      },
      signal,
    })
    .then((response) => unwrapApiResponse(response));
}

export function deleteResource(id: string, signal?: AbortSignal) {
  return apiClient
    .DELETE('/api/resources/{id}', {
      params: {
        path: { id },
      },
      signal,
    })
    .then((response) => unwrapApiResponse(response));
}
