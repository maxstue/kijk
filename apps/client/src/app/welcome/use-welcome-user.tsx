import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { userSignInQuery } from '@/app/root/use-signin-user';
import type { UserStepFormValues } from '@/app/welcome/schemas';
import { apiClient } from '@/shared/lib/api-client';
import type { ApiError } from '@/shared/types/app';

export const useWelcomeUser = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, AxiosError<ApiError>, UserStepFormValues>({
    mutationFn: (data: UserStepFormValues) =>
      apiClient.put({
        data: data,
        url: 'users/welcome',
      }),
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
