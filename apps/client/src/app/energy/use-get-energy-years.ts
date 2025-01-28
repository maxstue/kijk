import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getYears } from '@/shared/api/energy';

export const getEnergyYearsQuery = queryOptions({
  queryKey: ['energies', 'years'],
  queryFn: ({ signal }) => getYears(signal),
});

export const useGetEnergyYears = () => useSuspenseQuery(getEnergyYearsQuery);
