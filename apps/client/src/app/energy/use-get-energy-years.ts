import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getYears } from '@/shared/api/energy';

export const getEnergyYearsQuery = queryOptions({
  queryKey: ['energy', 'years'],
  queryFn: ({ signal }) => getYears(signal),
});

export const useGetEnergyYears = () => useSuspenseQuery(getEnergyYearsQuery);
