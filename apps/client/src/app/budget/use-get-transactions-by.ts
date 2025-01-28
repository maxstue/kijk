import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getTransactionBy } from '@/shared/api/transactions';

export const getTransactionsQuery = (year?: number, month?: string) => {
  const y = year ? year.toString() : undefined;
  const m = month ?? undefined;

  return queryOptions({
    queryKey: ['transactions', 'getBy', y, m],
    queryFn: ({ signal }) => getTransactionBy(y, m, signal),
    placeholderData: (previous) => previous ?? [],
  });
};

export const useGetTransactionsBy = (year?: number, month?: string) =>
  useSuspenseQuery(getTransactionsQuery(year, month));
