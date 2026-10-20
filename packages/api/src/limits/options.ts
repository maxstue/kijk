import { invalidate } from '@kijk/api/cache';
import { queryKeys } from '@kijk/api/query-keys';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { create, remove, list, update } from './requests';
import type { CreateLimitRequest, UpdateLimitData } from './types';

/** Query for the limits of the active space. */
export const listQueryOptions = (spaceId: string) =>
  queryOptions({
    queryFn: ({ signal }) => list(spaceId, signal),
    queryKey: queryKeys.limits.list(spaceId),
  });

/** Mutation that creates a limit. */
export const createMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: CreateLimitRequest) => create(spaceId, data),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.limits.all(spaceId)),
  });

/** Mutation that updates a limit. */
export const updateMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: UpdateLimitData) => update(spaceId, data),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.limits.all(spaceId)),
  });

/** Mutation that deletes a limit. */
export const deleteMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (id: string) => remove(spaceId, id),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.limits.all(spaceId)),
  });
