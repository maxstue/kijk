import { queryOptions, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/api-client';
import { ApiResponse, Transaction } from '@/types/app';

const getTransactions = (year: number, month: string) =>
  queryOptions({
    queryKey: ['transactions', 'getBy', year, month],
    queryFn: async () => {
      return apiClient.get<ApiResponse<Transaction[]>>({
        url: 'transactions',
        params: new URLSearchParams({ year: year.toString(), month: month }),
      });
    },
  });

export const useGetTransactionsBy = (year: number, month: string) => useQuery(getTransactions(year, month));
