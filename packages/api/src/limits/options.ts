import { invalidate } from '@kijk/api/cache';
import { queryKeys } from '@kijk/api/query-keys';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { createLimit, deleteLimit, getLimits, updateLimit } from './requests';
import type { CreateLimitRequest, UpdateLimitData } from './types';

/** Query for the limits of the active space. */
export const limitsQueryOptions = () =>
  queryOptions({
    queryFn: ({ signal }) => getLimits(signal),
    queryKey: queryKeys.limits.list(),
  });

/** Mutation that creates a limit. */
export const createLimitMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: CreateLimitRequest) => createLimit(data),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.limits.all),
  });

/** Mutation that updates a limit. */
export const updateLimitMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: UpdateLimitData) => updateLimit(data),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.limits.all),
  });

/** Mutation that deletes a limit. */
export const deleteLimitMutationOptions = () =>
  mutationOptions({
    mutationFn: (id: string) => deleteLimit(id),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.limits.all),
  });
