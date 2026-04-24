import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getYears } from '@/shared/api/consumptions';

export const getYearsFromConsumptionsQuery = queryOptions({
  queryFn: ({ signal }) => getYears(signal),
  queryKey: ['consumptions', 'years'],
});

export const useGetYearsFromConsumptions = () => useSuspenseQuery(getYearsFromConsumptionsQuery);
