import { useMutation, useQueryClient } from '@tanstack/react-query';

import { UserUpdateFormValues } from '@/app/settings/profile/schemas';
import { apiClient } from '@/lib/api-client';
import { useAuthStoreActions } from '@/stores/auth-store';
import { ApiResponse, AppUser } from '@/types/app';

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStoreActions();

  return useMutation({
    mutationFn: async (data: UserUpdateFormValues) => {
      return apiClient.put<ApiResponse<AppUser>>({
        url: `users`,
        data: { userName: data.userName, useDefaultCategories: data.useDefaultCategories },
      });
    },
    async onSuccess(data) {
      queryClient.setQueryData(['users', 'sign-in'], data);
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      if (data.data) {
        setUser(data.data);
      }
    },
  });
};
