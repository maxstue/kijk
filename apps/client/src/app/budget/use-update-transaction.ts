import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { TransactionFormValues } from '@/app/budget/schemas';
import { apiClient } from '@/lib/api-client';
import { Id, Months } from '@/types/app';

export const useUpdateTransaction = () => {
  const { getToken } = useKindeAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      transactionId: Id;
      year?: number;
      month?: Months;
      newTransaction: Partial<TransactionFormValues>;
    }) => {
      return apiClient
        .put(`transactions/${data.transactionId}`, {
          json: data.newTransaction,
          headers: { Authorization: `Bearer ${await getToken()}` },
        })
        .json();
    },
    async onSuccess(_, variables) {
      await queryClient.invalidateQueries({ queryKey: ['transactions', 'getBy', variables.year, variables.month] });
    },
  });
};
