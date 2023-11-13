import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { ApiResponse, User } from '@/types/app';

export const userInitQuery = queryOptions({
  queryKey: ['users', 'init'],
  queryFn: async () => apiClient.get<ApiResponse<User>>({ url: 'users/init' }),
});

export const useInitUser = () => useSuspenseQuery(userInitQuery);
