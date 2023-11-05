import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/api-client';
import { Id, Months } from '@/types/app';

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { transactionId: Id; year?: number; month?: Months }) => {
      return apiClient.delete({
        url: `transactions/${data.transactionId}`,
      });
    },
    async onSuccess(_, variables) {
      await queryClient.invalidateQueries({ queryKey: ['transactions', 'getBy', variables.year, variables.month] });
    },
  });
};
