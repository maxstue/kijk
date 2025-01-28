import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getYears } from '@/shared/api/transactions';

export const getTransactionYearsQuery = queryOptions({
  queryKey: ['transactions', 'years'],
  queryFn: ({ signal }) => getYears(signal),
});

export const useGetTransactionYears = () => useSuspenseQuery(getTransactionYearsQuery);
