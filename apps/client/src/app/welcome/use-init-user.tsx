import { useMutation, useQueryClient } from '@tanstack/react-query';

import { UserStepFormValues } from '@/app/welcome/schemas';
import { apiClient } from '@/shared/lib/api-client';

export const useInitUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserStepFormValues) => {
      return apiClient.put({
        url: 'users/welcome',
        data: data,
      });
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ['users', 'sign-in'] });
    },
  });
};
