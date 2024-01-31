import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateUser } from '@/shared/api/users';
import { useAuthStoreActions } from '@/shared/stores/auth-store';

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStoreActions();

  return useMutation({
    mutationFn: updateUser,
    async onSuccess(data) {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      if (data.data) {
        setUser(data.data);
      }
    },
  });
};
