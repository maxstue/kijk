import * as usersOptions from '@kijk/api/users/options';
import { useMutation } from '@tanstack/react-query';

import { AnalyticsService } from '@/shared/lib/analytics-tracking';

/** Completes onboarding, stores the analytics consent and caches the returned account. */
export const useWelcomeUser = () => {
  const options = usersOptions.completeOnboardingMutationOptions();

  return useMutation({
    ...options,
    async onSuccess(...args) {
      const [data] = args;
      AnalyticsService.setCookieConsent(data.user!.analyticsConsent === 'Accepted' ? 'accepted' : 'declined');
      await options.onSuccess?.(...args);
    },
  });
};
