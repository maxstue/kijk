import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/query-keys';
import { signedInUserQueryOptions, welcomeUserMutationOptions } from '@/shared/api/users/options';

export const useWelcomeUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...welcomeUserMutationOptions(),
    onSuccess() {
      const cachedUser = queryClient.getQueryData(signedInUserQueryOptions().queryKey);
      if (cachedUser) {
        queryClient.setQueryData(signedInUserQueryOptions().queryKey, {
          ...cachedUser,
          firstTime: false,
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.users.current });
    },
  });
};
