import { invalidate } from '@kijk/api/cache';
import { keepPreviousPageInSpace } from '@kijk/api/paging';
import type { ListQuery } from '@kijk/api/paging';
import { queryKeys } from '@kijk/api/query-keys';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { create, remove, list, update } from './requests';
import type { AccountPage, AccountSort, CreateAccountRequest, UpdateAccountRequest } from './types';

/**
 * Query for the accounts of the active space. Tables pass a search, sort and page; selects omit the query to get every
 * row.
 */
export const listQueryOptions = (spaceId: string, query: ListQuery<AccountSort> = {}) =>
  queryOptions({
    placeholderData: keepPreviousPageInSpace<AccountPage>(spaceId),
    queryFn: ({ signal }) => list(spaceId, query, signal),
    queryKey: queryKeys.accounts.list(spaceId, query),
  });

/** Mutation that creates an account. */
export const createMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: CreateAccountRequest) => create(spaceId, data),
    onSuccess: (_data, _variables, _result, { client }) =>
      invalidate(client, queryKeys.dashboard.all(spaceId), queryKeys.accounts.all(spaceId)),
  });

/** Mutation that updates an account. */
export const updateMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: ({ data, id }: { data: UpdateAccountRequest; id: string }) => update(spaceId, id, data),
    // Transactions show the account name.
    onSuccess: (_data, _variables, _result, { client }) =>
      invalidate(
        client,
        queryKeys.dashboard.all(spaceId),
        queryKeys.accounts.all(spaceId),
        queryKeys.transactions.all(spaceId),
        queryKeys.imports.all(spaceId),
      ),
  });

/** Mutation that deletes an account. */
export const deleteMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (id: string) => remove(spaceId, id),
    onSuccess: (_data, _variables, _result, { client }) =>
      invalidate(client, queryKeys.dashboard.all(spaceId), queryKeys.accounts.all(spaceId)),
  });
