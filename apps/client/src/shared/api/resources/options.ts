import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/query-keys';

import { createResource, deleteResource, getResource, getResources, updateResource } from './requests';
import type { ResourceData, UpdateResourceData } from './types';

/** Query for the resources of the active space. */
export const resourcesQueryOptions = () =>
  queryOptions({
    queryFn: ({ signal }) => getResources(signal),
    queryKey: queryKeys.resources.list(),
  });

/** Query for a single resource. */
export const resourceQueryOptions = (id: string) =>
  queryOptions({
    queryFn: ({ signal }) => getResource(id, signal),
    queryKey: queryKeys.resources.detail(id),
  });

/** Mutation that creates a resource. */
export const createResourceMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: ResourceData) => createResource(data),
  });

/** Mutation that updates a resource. */
export const updateResourceMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: UpdateResourceData) => updateResource(data),
  });

/** Mutation that deletes a resource. */
export const deleteResourceMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: { id: string }) => deleteResource(data.id),
  });
