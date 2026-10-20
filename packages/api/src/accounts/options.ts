import { invalidate } from '@kijk/api/cache';
import { queryKeys } from '@kijk/api/query-keys';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { create, remove, list, update } from './requests';
import type { CreateAccountRequest, UpdateAccountRequest } from './types';

/** Query for the accounts of the active space. */
export const listQueryOptions = (spaceId: string) =>
  queryOptions({
    queryFn: ({ signal }) => list(spaceId, signal),
    queryKey: queryKeys.accounts.list(spaceId),
  });

/** Mutation that creates an account. */
export const createMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: CreateAccountRequest) => create(spaceId, data),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.accounts.all(spaceId)),
  });

/** Mutation that updates an account. */
export const updateMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: ({ data, id }: { data: UpdateAccountRequest; id: string }) => update(spaceId, id, data),
    // Transactions show the account name.
    onSuccess: (_data, _variables, _result, { client }) =>
      invalidate(
        client,
        queryKeys.accounts.all(spaceId),
        queryKeys.transactions.all(spaceId),
        queryKeys.imports.all(spaceId),
      ),
  });

/** Mutation that deletes an account. */
export const deleteMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (id: string) => remove(spaceId, id),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.accounts.all(spaceId)),
  });
