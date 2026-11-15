import { invalidate } from '@kijk/api/cache';
import { keepPreviousPageInSpace } from '@kijk/api/paging';
import type { ListQuery } from '@kijk/api/paging';
import { queryKeys } from '@kijk/api/query-keys';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { create, remove, getDetails, list, update } from './requests';
import type { ResourceData, ResourcePage, ResourceSort, UpdateResourceData } from './types';

/**
 * Query for the resources of the active space. Tables pass a search, sort and page; selects omit the query to get every
 * row.
 */
export const listQueryOptions = (spaceId: string, query: ListQuery<ResourceSort> = {}) =>
  queryOptions({
    placeholderData: keepPreviousPageInSpace<ResourcePage>(spaceId),
    queryFn: ({ signal }) => list(spaceId, query, signal),
    queryKey: queryKeys.resources.list(spaceId, query),
  });

/** Query for a single resource. */
export const detailsQueryOptions = (spaceId: string, id: string) =>
  queryOptions({
    queryFn: ({ signal }) => getDetails(spaceId, id, signal),
    queryKey: queryKeys.resources.detail(spaceId, id),
  });

/** Mutation that creates a resource. */
export const createMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: ResourceData) => create(spaceId, data),
    onSuccess: (_data, _variables, _result, { client }) =>
      invalidate(client, queryKeys.dashboard.all(spaceId), queryKeys.resources.all(spaceId)),
  });

/** Mutation that updates a resource. */
export const updateMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: UpdateResourceData) => update(spaceId, data),
    // Consumptions and limits show the resource; a unit change also converts limit thresholds.
    onSuccess: (_data, _variables, _result, { client }) =>
      invalidate(
        client,
        queryKeys.dashboard.all(spaceId),
        queryKeys.resources.all(spaceId),
        queryKeys.consumptions.all(spaceId),
        queryKeys.limits.all(spaceId),
      ),
  });

/** Mutation that deletes a resource. */
export const deleteMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: { id: string }) => remove(spaceId, data.id),
    onSuccess: (_data, _variables, _result, { client }) =>
      invalidate(client, queryKeys.dashboard.all(spaceId), queryKeys.resources.all(spaceId)),
  });
