import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/query-keys';

import { createResource, deleteResource, getResources, updateResource } from './requests';
import type { ResourceData, UpdateResourceData } from './types';

export const resourcesQueryOptions = () =>
  queryOptions({
    queryFn: ({ signal }) => getResources(signal),
    queryKey: queryKeys.resources.list(),
  });

export const createResourceMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: ResourceData) => createResource(data),
  });

export const updateResourceMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: UpdateResourceData) => updateResource(data),
  });

export const deleteResourceMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: { id: string }) => deleteResource(data.id),
  });
