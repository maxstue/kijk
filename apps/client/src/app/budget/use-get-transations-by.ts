import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getTransactionById } from '@/shared/api/transactions';
import { ApiResponse, Transaction } from '@/shared/types/app';

export const getTransactionsQuery = (year?: number, month?: string) => {
  const y = year ? year.toString() : undefined;
  const m = month ? month : undefined;

  return queryOptions({
    queryKey: ['transactions', 'getBy', y, m],
    queryFn: ({ signal }) => getTransactionById(y, m, signal),
    placeholderData: (prev) => prev ?? ({ state: 'Success', data: [] } as ApiResponse<Transaction[]>),
  });
};

export const useGetTransactionsBy = (year?: number, month?: string) =>
  useSuspenseQuery(getTransactionsQuery(year, month));
