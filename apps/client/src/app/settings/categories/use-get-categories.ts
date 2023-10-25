import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { useSuspenseQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/api-client';
import { ApiResponse, Category } from '@/types/app';

export const useGetCategories = () => {
  const { getToken } = useKindeAuth();

  return useSuspenseQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      return apiClient.get<ApiResponse<Category[]>>({
        url: 'categories',
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
    },
  });
};
