import { UseQueryOptions } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/api-client';

const userInit: UseQueryOptions = {
  queryKey: ['users', 'init'],
  queryFn: async () => {
    return apiClient.get({
      url: 'users/init',
    });
  },
};

export const userApi = {
  userInit,
};
