import { useMutation, useQueryClient } from '@tanstack/react-query';

import { TransactionFormValues } from '@/app/budget/schemas';
import { apiClient } from '@/lib/api-client';
import { ApiResponse, months, Transaction } from '@/types/app';

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { newTransaction: TransactionFormValues }) => {
      return apiClient.post<ApiResponse<Transaction>>({
        url: 'transactions',
        data: data.newTransaction,
      });
    },
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
