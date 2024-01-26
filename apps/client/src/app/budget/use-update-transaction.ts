import { useMutation, useQueryClient } from '@tanstack/react-query';

import { TransactionFormValues } from '@/app/budget/schemas';
import { updateTransaction } from '@/shared/api/transactions';
import { Id, Months } from '@/shared/types/app';

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      transactionId: Id;
      year?: number;
      month?: Months;
      newTransaction: Partial<TransactionFormValues>;
    }) => updateTransaction(data.transactionId, data.newTransaction),
    async onSuccess(_, variables) {
      await queryClient.invalidateQueries({ queryKey: ['transactions', 'getBy', variables.year, variables.month] });
    },
  });
};
