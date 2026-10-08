import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/query-keys';

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
  });

/** Mutation that updates an account. */
export const updateAccountMutationOptions = () =>
  mutationOptions({
    mutationFn: ({ data, id }: { data: UpdateAccountRequest; id: string }) => updateAccount(id, data),
  });

/** Mutation that deletes an account. */
export const deleteAccountMutationOptions = () =>
  mutationOptions({
    mutationFn: (id: string) => deleteAccount(id),
  });
