import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateUser } from '@/shared/api/users';

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,
    async onSuccess(data) {
      await queryClient.invalidateQueries({ queryKey: ['resource-types'] });
      await queryClient.setQueryData(['users', 'sign-in'], () => data);
    },
  });
};
