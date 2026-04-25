import { useMutation, useQueryClient } from '@tanstack/react-query';

import { userSignInQuery } from '@/app/root/use-signin-user';
import type { UserStepFormValues } from '@/app/welcome/schemas';
import { welcomeUser } from '@/shared/api/users';
import type { ApiClientError, ApiProblem } from '@/shared/lib/api-client';
import type { AppUser } from '@/shared/types/app';

export const useWelcomeUser = () => {
  const queryClient = useQueryClient();

  return useMutation<AppUser, ApiClientError<ApiProblem>, UserStepFormValues>({
    mutationFn: (data: UserStepFormValues) => welcomeUser(data),
    onSuccess() {
      const cachedUser = queryClient.getQueryData(userSignInQuery.queryKey);
      if (cachedUser) {
        queryClient.setQueryData(userSignInQuery.queryKey, {
          ...cachedUser,
          firstTime: false,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['users', 'sign-in'] });
    },
  });
};
