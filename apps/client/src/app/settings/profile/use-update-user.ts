import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/query-keys';
import { updateUserMutationOptions } from '@/shared/api/users/options';

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const mutationOptions = updateUserMutationOptions();

  return useMutation({
    ...mutationOptions,
    async onSuccess(data) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.resources.all });
      await queryClient.setQueryData(queryKeys.users.current, () => data);
    },
  });
};
