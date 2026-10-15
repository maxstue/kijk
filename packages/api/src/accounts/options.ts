import { invalidate } from '@kijk/api/cache';
import { queryKeys } from '@kijk/api/query-keys';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { createAccount, deleteAccount, getAccounts, updateAccount } from './requests';
import type { CreateAccountRequest, UpdateAccountRequest } from './types';

/** Query for the accounts of the active space. */
export const accountsQueryOptions = (spaceId: string) =>
  queryOptions({
    queryFn: ({ signal }) => getAccounts(spaceId, signal),
    queryKey: queryKeys.accounts.list(spaceId),
  });

/** Mutation that creates an account. */
export const createAccountMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: CreateAccountRequest) => createAccount(spaceId, data),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.accounts.all(spaceId)),
  });

/** Mutation that updates an account. */
export const updateAccountMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: ({ data, id }: { data: UpdateAccountRequest; id: string }) => updateAccount(spaceId, id, data),
    // Transactions show the account name.
    onSuccess: (_data, _variables, _result, { client }) =>
      invalidate(client, queryKeys.accounts.all(spaceId), queryKeys.transactions.all(spaceId)),
  });

/** Mutation that deletes an account. */
export const deleteAccountMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (id: string) => deleteAccount(spaceId, id),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.accounts.all(spaceId)),
  });
