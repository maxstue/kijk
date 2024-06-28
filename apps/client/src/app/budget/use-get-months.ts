import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { months } from '@/shared/types/app';

const getMonthsQuery = queryOptions({
  queryKey: ['transactions', 'months', months],
  queryFn: () => months,
});

export const useGetMonths = () => useSuspenseQuery(getMonthsQuery);
