import { invalidate } from '@kijk/api/cache';
import { queryKeys } from '@kijk/api/query-keys';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { createResource, deleteResource, getResource, getResources, updateResource } from './requests';
import type { ResourceData, UpdateResourceData } from './types';

/** Query for the resources of the active space. */
export const resourcesQueryOptions = (spaceId: string) =>
  queryOptions({
    queryFn: ({ signal }) => getResources(spaceId, signal),
    queryKey: queryKeys.resources.list(spaceId),
  });

/** Query for a single resource. */
export const resourceQueryOptions = (spaceId: string, id: string) =>
  queryOptions({
    queryFn: ({ signal }) => getResource(spaceId, id, signal),
    queryKey: queryKeys.resources.detail(spaceId, id),
  });

/** Mutation that creates a resource. */
export const createResourceMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: ResourceData) => createResource(spaceId, data),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.resources.all(spaceId)),
  });

/** Mutation that updates a resource. */
export const updateResourceMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: UpdateResourceData) => updateResource(spaceId, data),
    // Consumptions show the resource and its unit.
    onSuccess: (_data, _variables, _result, { client }) =>
      invalidate(client, queryKeys.resources.all(spaceId), queryKeys.consumptions.all(spaceId)),
  });

/** Mutation that deletes a resource. */
export const deleteResourceMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: { id: string }) => deleteResource(spaceId, data.id),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.resources.all(spaceId)),
  });
