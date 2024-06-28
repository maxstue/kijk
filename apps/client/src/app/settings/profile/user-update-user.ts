import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateUser } from '@/shared/api/users';
import { ApiResponse, AppUser } from '@/shared/types/app';

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,
    async onSuccess(data) {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.setQueryData(['users', 'sign-in'], (old: ApiResponse<AppUser>) => ({
        ...old,
        data: data.data,
      }));
    },
  });
};
