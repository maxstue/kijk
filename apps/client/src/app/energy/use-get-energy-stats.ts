import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getEnergyStats } from '@/shared/api/energy';

export const getEnergyStatsQuery = (year?: number, month?: string) => {
  const y = year ? year.toString() : undefined;
  const m = month ?? undefined;

  return queryOptions({
    queryKey: ['energies', 'stats', y, m],
    queryFn: ({ signal }) => getEnergyStats(y, m, signal),
    placeholderData: (previous) => previous,
  });
};

export const useGetEnergyStats = (year?: number, month?: string) => useSuspenseQuery(getEnergyStatsQuery(year, month));
