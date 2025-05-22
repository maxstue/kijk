import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import type { UserStepFormValues } from '@/app/welcome/schemas';
import type { ApiError } from '@/shared/types/app';
import { userSignInQuery } from '@/app/root/use-signin-user';
import { apiClient } from '@/shared/lib/api-client';

export const useWelcomeUser = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, AxiosError<ApiError>, UserStepFormValues>({
    mutationFn: (data: UserStepFormValues) => {
      return apiClient.put({
        url: 'users/welcome',
        data: data,
      });
    },
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
