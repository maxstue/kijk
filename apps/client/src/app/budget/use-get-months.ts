import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { months } from '@/types/app';

const getMonths = queryOptions({
  queryKey: ['transactions', 'months', months],
  queryFn: () => months,
});

export const useGetMonths = () => useSuspenseQuery(getMonths);
