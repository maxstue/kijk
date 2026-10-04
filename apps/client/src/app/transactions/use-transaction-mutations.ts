import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/query-keys';
import {
  createTransactionMutationOptions,
  deleteTransactionMutationOptions,
  updateTransactionMutationOptions,
} from '@/shared/api/transactions/options';

function useInvalidateFinances() {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all }),
    ]);
  };
}

/** Records a transaction and refreshes transactions and budget evaluations. */
export function useCreateTransaction() {
  const invalidate = useInvalidateFinances();
  return useMutation({ ...createTransactionMutationOptions(), onSuccess: invalidate });
}

/** Updates a transaction and refreshes transactions and budget evaluations. */
export function useUpdateTransaction() {
  const invalidate = useInvalidateFinances();
  return useMutation({ ...updateTransactionMutationOptions(), onSuccess: invalidate });
}

/** Deletes a transaction and refreshes transactions and budget evaluations. */
export function useDeleteTransaction() {
  const invalidate = useInvalidateFinances();
  return useMutation({ ...deleteTransactionMutationOptions(), onSuccess: invalidate });
}
