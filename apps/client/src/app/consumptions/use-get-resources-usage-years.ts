import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getYears } from '@/shared/api/consumptions';

export const getYearsFromConsumptionsQuery = queryOptions({
  queryKey: ['consumptions', 'years'],
  queryFn: ({ signal }) => getYears(signal),
});

export const useGetYearsFromConsumptions = () => useSuspenseQuery(getYearsFromConsumptionsQuery);
