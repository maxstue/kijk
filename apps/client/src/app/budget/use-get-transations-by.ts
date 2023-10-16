import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { ApiResponse, Transaction } from '@/types/app';

export const useGetTransactionsBy = (year: number, month: string) => {
  const { getToken } = useKindeAuth();

  return useQuery<ApiResponse<Transaction[]>>({
    queryKey: ['transactions', 'getBy', year, month],
    queryFn: async () => {
      return apiClient
        .get('transactions', {
          searchParams: {
            year: year,
            month: month,
          },
          headers: { Authorization: `Bearer ${await getToken()}` },
        })
        .json();
    },
  });
};
