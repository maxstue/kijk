import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getResources } from '@/shared/api/resources';

const getResourcesQuery = queryOptions({
  queryFn: ({ signal }) => getResources(signal),
  queryKey: ['resources'],
});

export const useGetResources = () => useSuspenseQuery(getResourcesQuery);
