import { useMutation, useQueryClient } from '@tanstack/react-query';

import { TransactionFormValues } from '@/app/budget/schemas';
import { createTransaction } from '@/shared/api/transactions';
import { months } from '@/shared/types/app';

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { newTransaction: TransactionFormValues }) => createTransaction(data.newTransaction),
    async onSuccess(_, variables) {
      await queryClient.invalidateQueries({
        queryKey: [
          'transactions',
          'getBy',
          variables.newTransaction.executedAt.getFullYear().toString(),
          months[variables.newTransaction.executedAt.getMonth()],
        ],
      });
    },
  });
};
