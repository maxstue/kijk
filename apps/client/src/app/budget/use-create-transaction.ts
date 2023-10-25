import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { TransactionFormValues } from '@/app/budget/schemas';
import { apiClient } from '@/lib/api/api-client';
import { Months } from '@/types/app';

export const useCreateTransaction = () => {
  const { getToken } = useKindeAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { year?: number; month?: Months; newTransaction: TransactionFormValues }) => {
      return apiClient.post({
        url: 'transactions',
        data: data.newTransaction,
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
    },
    async onSuccess(_, variables) {
      await queryClient.invalidateQueries({ queryKey: ['transactions', 'getBy', variables.year, variables.month] });
    },
  });
};
