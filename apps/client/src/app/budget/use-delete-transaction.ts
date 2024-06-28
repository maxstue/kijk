import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteTransaction } from '@/shared/api/transactions';
import { Months } from '@/shared/types/app';

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { transactionId: string; year?: number; month?: Months }) =>
      deleteTransaction(data.transactionId),
    async onSuccess(_, variables) {
      await queryClient.invalidateQueries({ queryKey: ['transactions', 'getBy', variables.year, variables.month] });
    },
  });
};
