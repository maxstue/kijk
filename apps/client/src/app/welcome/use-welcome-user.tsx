import { useMutation, useQueryClient } from '@tanstack/react-query';

import { currentUserQueryOptions, welcomeUserMutationOptions } from '@/shared/api/users/options';
import { AnalyticsService } from '@/shared/lib/analytics-tracking';

export const useWelcomeUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...welcomeUserMutationOptions(),
    onSuccess(data) {
      AnalyticsService.setCookieConsent(data.user!.analyticsConsent === 'Accepted' ? 'accepted' : 'declined');
      queryClient.setQueryData(currentUserQueryOptions().queryKey, data);
    },
  });
};
