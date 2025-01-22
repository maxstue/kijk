import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getEnergyBy } from '@/shared/api/energy';

export const getEnergiesQuery = (year?: number, month?: string) => {
  const y = year ? year.toString() : undefined;
  const m = month ?? undefined;

  return queryOptions({
    queryKey: ['energies', 'getBy', y, m],
    queryFn: ({ signal }) => getEnergyBy(y, m, signal),
    placeholderData: (previous) => previous ?? [],
  });
};

export const useGetEnergiesBy = (year?: number, month?: string) => useSuspenseQuery(getEnergiesQuery(year, month));
