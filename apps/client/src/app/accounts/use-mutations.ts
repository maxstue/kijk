import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createAccountMutationOptions,
  deleteAccountMutationOptions,
  updateAccountMutationOptions,
} from '@/shared/api/accounts/options';
import { queryKeys } from '@/shared/api/query-keys';

/** Creates an account and refreshes the account queries. */
export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    ...createAccountMutationOptions(),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });
}

/** Updates an account and refreshes the account and transaction queries, which show its name. */
export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    ...updateAccountMutationOptions(),
    async onSuccess() {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
      ]);
    },
  });
}

/** Deletes an account and refreshes the account queries. */
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    ...deleteAccountMutationOptions(),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });
}
