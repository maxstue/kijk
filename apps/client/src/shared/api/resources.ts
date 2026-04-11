import type { ResourceFormValues } from '@/app/resources/schemas';
import { apiClient } from '@/shared/lib/api-client';
import type { Resource } from '@/shared/types/app';

const ENDPOINT = 'resources';

export function getResources(signal?: AbortSignal) {
  return apiClient.get<Resource[]>({
    signal,
    url: ENDPOINT,
  });
}

export function createResource(data: ResourceFormValues, signal?: AbortSignal) {
  return apiClient.post<Resource>({
    data,
    signal,
    url: ENDPOINT,
  });
}

export function updateResource(data: { id: string; resourceType: ResourceFormValues }, signal?: AbortSignal) {
  return apiClient.put({
    data: data.resourceType,
    signal,
    url: `${ENDPOINT}/${data.id}`,
  });
}

export function deleteResource(id: string, signal?: AbortSignal) {
  return apiClient.delete({
    signal,
    url: `${ENDPOINT}/${id}`,
  });
}
