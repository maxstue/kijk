import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/api-client';

export const useInitUser = () => {
  const { user } = useKindeAuth();

  return useMutation({
    mutationFn: async () => {
      return apiClient.post({
        url: 'users/init',
        data: user,
      });
    },
  });
};
