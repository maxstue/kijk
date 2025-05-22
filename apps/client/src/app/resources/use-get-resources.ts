import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getResources } from '@/shared/api/resources';

const getResourcesQuery = queryOptions({
  queryKey: ['resources'],
  queryFn: ({ signal }) => getResources(signal),
});

export const useGetResources = () => useSuspenseQuery(getResourcesQuery);
