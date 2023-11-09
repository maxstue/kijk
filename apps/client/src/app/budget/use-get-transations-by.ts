import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/api-client';
import { ApiResponse, Transaction } from '@/types/app';

const getTransactions = (year: number, month: string) =>
  queryOptions({
    queryKey: ['transactions', 'getBy', year.toString(), month],
    queryFn: async () => {
      return apiClient.get<ApiResponse<Transaction[]>>({
        url: 'transactions',
        params: new URLSearchParams({ year: year.toString(), month: month }),
      });
    },
    placeholderData: (prev) => prev,
  });

export const useGetTransactionsBy = (year: number, month: string) => useSuspenseQuery(getTransactions(year, month));
