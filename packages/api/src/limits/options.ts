import { invalidate } from '@kijk/api/cache';
import { queryKeys } from '@kijk/api/query-keys';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { createLimit, deleteLimit, getLimits, updateLimit } from './requests';
import type { CreateLimitRequest, UpdateLimitData } from './types';

/** Query for the limits of the active space. */
export const limitsQueryOptions = (spaceId: string) =>
  queryOptions({
    queryFn: ({ signal }) => getLimits(spaceId, signal),
    queryKey: queryKeys.limits.list(spaceId),
  });

/** Mutation that creates a limit. */
export const createLimitMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: CreateLimitRequest) => createLimit(spaceId, data),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.limits.all(spaceId)),
  });

/** Mutation that updates a limit. */
export const updateLimitMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: UpdateLimitData) => updateLimit(spaceId, data),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.limits.all(spaceId)),
  });

/** Mutation that deletes a limit. */
export const deleteLimitMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (id: string) => deleteLimit(spaceId, id),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.limits.all(spaceId)),
  });
