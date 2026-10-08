import { useMutation, useQueryClient } from '@tanstack/react-query';

import { currentUserQueryOptions, welcomeUserMutationOptions } from '@/shared/api/users/options';
import { AnalyticsService } from '@/shared/lib/analytics-tracking';

/** Completes onboarding, stores the analytics consent and caches the returned account. */
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
