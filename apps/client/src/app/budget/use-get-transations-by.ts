// import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/api-client';
import { ApiResponse, Transaction } from '@/types/app';

export const useGetTransactionsBy = (year: number, month: string) => {
  // const { getToken } = useKindeAuth();

  return useQuery({
    queryKey: ['transactions', 'getBy', year, month],
    queryFn: async () => {
      return apiClient.get<ApiResponse<Transaction[]>>({
        url: 'transactions',
        params: new URLSearchParams({ year: year.toString(), month: month }),
        // headers: { Authorization: `Bearer ${await getToken()}` },
      });
    },
  });
};
