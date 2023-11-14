import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { ApiResponse, AppUser } from '@/types/app';

export const userSignInQuery = queryOptions({
  queryKey: ['users', 'sign-in'],
  queryFn: async () => apiClient.get<ApiResponse<AppUser>>({ url: 'users/sign-in' }),
});

export const useSignInUser = () => useSuspenseQuery(userSignInQuery);
