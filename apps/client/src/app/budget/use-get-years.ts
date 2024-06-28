import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getYears } from '@/shared/api/transactions';

export const getYearsQuery = queryOptions({
  queryKey: ['transactions', 'years'],
  queryFn: ({ signal }) => getYears(signal),
});

export const useGetYears = () => useSuspenseQuery(getYearsQuery);
