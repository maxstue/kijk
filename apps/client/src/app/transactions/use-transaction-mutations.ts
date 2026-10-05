import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/query-keys';
import {
  categorizeTransactionMutationOptions,
  categorizeTransactionsMutationOptions,
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
      // Corrections change remembered rules and the rule suggestions.
      queryClient.invalidateQueries({ queryKey: queryKeys.categoryRules.all }),
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

/** Corrects the category of a transaction and refreshes transactions and budget evaluations. */
export function useCategorizeTransaction() {
  const invalidate = useInvalidateFinances();
  return useMutation({ ...categorizeTransactionMutationOptions(), onSuccess: invalidate });
}

/** Assigns one category to several transactions and refreshes transactions and budget evaluations. */
export function useCategorizeTransactions() {
  const invalidate = useInvalidateFinances();
  return useMutation({ ...categorizeTransactionsMutationOptions(), onSuccess: invalidate });
}
