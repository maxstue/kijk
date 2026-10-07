import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/query-keys';
import { currentUserQueryOptions, updateUserMutationOptions } from '@/shared/api/users/options';

/** Updates the user's settings and refreshes the account and resource queries. */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const mutationOptions = updateUserMutationOptions();

  return useMutation({
    ...mutationOptions,
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: queryKeys.resources.all });
      await queryClient.invalidateQueries({ queryKey: currentUserQueryOptions().queryKey });
    },
  });
};
