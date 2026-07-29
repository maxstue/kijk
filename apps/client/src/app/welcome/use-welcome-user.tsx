import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/query-keys';
import { signedInUserQueryOptions, welcomeUserMutationOptions } from '@/shared/api/users/options';
import { AnalyticsService } from '@/shared/lib/analytics-client';

export const useWelcomeUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...welcomeUserMutationOptions(),
    onSuccess(data) {
      AnalyticsService.setCookieConsent(data.analyticsConsent === 'Accepted' ? 'accepted' : 'declined');
      queryClient.setQueryData(signedInUserQueryOptions().queryKey, data);
      queryClient.invalidateQueries({ queryKey: queryKeys.users.current });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.details });
    },
  });
};
