import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/api-client';
import { Id, Months } from '@/types/app';

export const useDeleteTransaction = () => {
  const { getToken } = useKindeAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { transactionId: Id; year?: number; month?: Months }) => {
      return apiClient.delete({
        url: `transactions/${data.transactionId}`,
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
    },
    async onSuccess(_, variables) {
      await queryClient.invalidateQueries({ queryKey: ['transactions', 'getBy', variables.year, variables.month] });
    },
  });
};
