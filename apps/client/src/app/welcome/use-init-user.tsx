import { useMutation, useQueryClient } from '@tanstack/react-query';

import { UserStepFormValues } from '@/app/welcome/schemas';
import { apiClient } from '@/lib/api-client';

export const useInitUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserStepFormValues) => {
      return apiClient.put({
        url: `users/init`,
        data: data,
      });
    },
    onSuccess(data) {
      queryClient.setQueryData(['users', 'sign-in'], data);
      void queryClient.invalidateQueries({ queryKey: ['users', 'sign-in'] });
    },
  });
};
