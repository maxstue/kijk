import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/api-client';

export const userInitQuery = queryOptions({
  queryKey: ['users', 'init'],
  queryFn: async () => {
    return apiClient.get({
      url: 'users/init',
    });
  },
});

export const useInitUser = () => useSuspenseQuery(userInitQuery);
