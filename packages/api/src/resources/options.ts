import { invalidate } from '@kijk/api/cache';
import { queryKeys } from '@kijk/api/query-keys';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

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
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.resources.all),
  });

/** Mutation that updates a resource. */
export const updateResourceMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: UpdateResourceData) => updateResource(data),
    // Consumptions show the resource and its unit.
    onSuccess: (_data, _variables, _result, { client }) =>
      invalidate(client, queryKeys.resources.all, queryKeys.consumptions.all),
  });

/** Mutation that deletes a resource. */
export const deleteResourceMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: { id: string }) => deleteResource(data.id),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.resources.all),
  });
