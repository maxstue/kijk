import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getConsumptionsBy } from '@/shared/api/consumptions';

export const getConsumptionsQuery = (year?: number, month?: string) => {
  const y = year ? year.toString() : undefined;
  const m = month ?? undefined;

  return queryOptions({
    queryKey: ['consumptions', 'usage', 'getBy', y, m],
    queryFn: ({ signal }) => getConsumptionsBy(y, m, signal),
    placeholderData: (previous) => previous ?? [],
  });
};

export const useGetConsumptionsBy = (year?: number, month?: string) =>
  useSuspenseQuery(getConsumptionsQuery(year, month));
