import { keepPreviousData, queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getConsumptionsBy } from '@/shared/api/consumptions';

export const getConsumptionsQuery = (year?: number, month?: string) => {
  const y = year ? year.toString() : undefined;
  const m = month ?? undefined;

  return queryOptions({
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getConsumptionsBy(y, m, signal),
    queryKey: ['consumptions', 'usage', 'getBy', y, m],
  });
};

export const useGetConsumptionsBy = (year?: number, month?: string) =>
  useSuspenseQuery(getConsumptionsQuery(year, month));
