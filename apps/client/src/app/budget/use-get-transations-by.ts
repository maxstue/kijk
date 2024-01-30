import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getTransactionById } from '@/shared/api/transactions';

export const getTransactionsQuery = (year?: number, month?: string) => {
  const y = year ? year.toString() : undefined;
  const m = month ? month : undefined;

  return queryOptions({
    queryKey: ['transactions', 'getBy', y, m],
    queryFn: ({ signal }) => getTransactionById(y, m, signal),
    placeholderData: (prev) => prev,
  });
};

export const useGetTransactionsBy = (year?: number, month?: string) =>
  useSuspenseQuery(getTransactionsQuery(year, month));
