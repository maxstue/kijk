import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getConsumptionsStats } from '@/shared/api/consumptions';

export const getConsumptionsStatsQuery = (year?: number, month?: string) => {
  const y = year ? year.toString() : undefined;
  const m = month ?? undefined;

  return queryOptions({
    queryKey: ['consumptions', 'stats', y, m],
    queryFn: ({ signal }) => getConsumptionsStats(y, m, signal),
    placeholderData: (previous) => previous,
  });
};

export const useGetConsumptionsStats = (year?: number, month?: string) =>
  useSuspenseQuery(getConsumptionsStatsQuery(year, month));
