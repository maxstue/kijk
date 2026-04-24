import { keepPreviousData, queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getConsumptionsStats } from '@/shared/api/consumptions';

export const getConsumptionsStatsQuery = (year?: number, month?: string) => {
  const y = year ? year.toString() : undefined;
  const m = month ?? undefined;

  return queryOptions({
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getConsumptionsStats(y, m, signal),
    queryKey: ['consumptions', 'stats', y, m],
  });
};

export const useGetConsumptionsStats = (year?: number, month?: string) =>
  useSuspenseQuery(getConsumptionsStatsQuery(year, month));
