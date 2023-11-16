import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { ApiResponse, Category } from '@/types/app';

const getCategories = queryOptions({
  queryKey: ['categories'],
  queryFn: async () => {
    return apiClient.get<ApiResponse<Category[]>>({
      url: 'categories',
    });
  },
});

export const useGetCategories = () => useSuspenseQuery(getCategories);
