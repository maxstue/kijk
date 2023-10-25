import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/api-client';
import { ApiError, ApiResponse, Category } from '@/types/app';

import { CategoryFormValues } from './schemas';

interface Options {
  category: CategoryFormValues;
}

export const useCreateCategory = () => {
  const { getToken } = useKindeAuth();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<Category>, ApiResponse<ApiError[]>, Options>({
    mutationFn: async (data: Options) => {
      return apiClient.post<ApiResponse<Category>>({
        url: 'categories',
        data: data.category,
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};
