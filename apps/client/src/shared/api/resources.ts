import type { ResourceFormValues } from '@/app/resources/schemas';
import { apiClient } from '@/shared/lib/api-client';
import type { Resource } from '@/shared/types/app';

const ENDPOINT = 'resources';

export function getResources(signal?: AbortSignal) {
  return apiClient.get<Resource[]>({
    url: ENDPOINT,
    signal,
  });
}

export function createResource(data: ResourceFormValues, signal?: AbortSignal) {
  return apiClient.post<Resource>({
    url: ENDPOINT,
    data,
    signal,
  });
}

export function updateResource(data: { id: string; resourceType: ResourceFormValues }, signal?: AbortSignal) {
  return apiClient.put({
    url: `${ENDPOINT}/${data.id}`,
    data: data.resourceType,
    signal,
  });
}

export function deleteResource(id: string, signal?: AbortSignal) {
  return apiClient.delete({
    url: `${ENDPOINT}/${id}`,
    signal,
  });
}
