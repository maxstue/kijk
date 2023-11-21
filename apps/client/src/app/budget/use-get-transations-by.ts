import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { ApiResponse, Transaction } from '@/types/app';

export const getTransactions = (year?: number, month?: string) => {
  const y = year ? year.toString() : undefined;
  const m = month ? month : undefined;

  return queryOptions({
    queryKey: ['transactions', 'getBy', y, m],
    queryFn: async () => {
      return apiClient.get<ApiResponse<Transaction[]>>({
        url: 'transactions',
        params: { year: y, month: m },
      });
    },
    placeholderData: (prev) => prev,
  });
};

export const useGetTransactionsBy = (year?: number, month?: string) => useSuspenseQuery(getTransactions(year, month));
