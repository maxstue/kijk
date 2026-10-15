import { invalidate } from '@kijk/api/cache';
import { queryKeys } from '@kijk/api/query-keys';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { createAccount, deleteAccount, getAccounts, updateAccount } from './requests';
import type { CreateAccountRequest, UpdateAccountRequest } from './types';

/** Query for the accounts of the active space. */
export const accountsQueryOptions = () =>
  queryOptions({
    queryFn: ({ signal }) => getAccounts(signal),
    queryKey: queryKeys.accounts.list(),
  });

/** Mutation that creates an account. */
export const createAccountMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: CreateAccountRequest) => createAccount(data),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.accounts.all),
  });

/** Mutation that updates an account. */
export const updateAccountMutationOptions = () =>
  mutationOptions({
    mutationFn: ({ data, id }: { data: UpdateAccountRequest; id: string }) => updateAccount(id, data),
    // Transactions show the account name.
    onSuccess: (_data, _variables, _result, { client }) =>
      invalidate(client, queryKeys.accounts.all, queryKeys.transactions.all),
  });

/** Mutation that deletes an account. */
export const deleteAccountMutationOptions = () =>
  mutationOptions({
    mutationFn: (id: string) => deleteAccount(id),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.accounts.all),
  });
