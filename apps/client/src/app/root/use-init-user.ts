import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

export const useInitUser = () => {
  const { getToken, user } = useKindeAuth();

  return useMutation({
    mutationFn: async () => {
      return apiClient
        .post('user/init', {
          json: user,
          headers: { Authorization: `Bearer ${await getToken()}` },
        })
        .json();
    },
  });
};
