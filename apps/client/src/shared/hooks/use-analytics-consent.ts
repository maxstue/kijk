import * as usersOptions from '@kijk/api/users/options';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AnalyticsService } from '@/shared/lib/analytics-tracking';
import { useAppAuth } from '@/shared/runtime/auth';
import type { CookieConsent } from '@/shared/types/analytics';

/** Reads and updates the analytics consent: stored on the account for signed-in users, otherwise in the browser. */
export function useAnalyticsConsent() {
  const { isLoaded, isSignedIn } = useAppAuth();
  const { data: currentAccount } = useQuery(usersOptions.meQueryOptions());
  const currentUser = currentAccount?.user;
  const [anonymousConsent, setAnonymousConsent] = useState<CookieConsent>(() => AnalyticsService.getCookieConsent());
  const serverConsent = toCookieConsent(currentUser?.analyticsConsent);
  const updateUserOptions = usersOptions.updateMutationOptions();
  const { mutate, isPending } = useMutation({
    ...updateUserOptions,
    async onSuccess(...args) {
      const [data] = args;
      AnalyticsService.setCookieConsent(toCookieConsent(data.analyticsConsent));
      await updateUserOptions.onSuccess?.(...args);
    },
  });

  useEffect(() => {
    if (isSignedIn === true && currentUser) {
      AnalyticsService.setCookieConsent(serverConsent);
    }
    if (isSignedIn === false) {
      AnalyticsService.setCookieConsent(anonymousConsent);
    }
  }, [anonymousConsent, currentUser, isSignedIn, serverConsent]);

  function updateConsent(consent: Exclude<CookieConsent, 'undecided'>) {
    if (isSignedIn) {
      mutate(
        { analyticsConsent: consent === 'accepted' ? 'Accepted' : 'Declined' },
        {
          onError() {
            toast('Could not update analytics settings. Please try again.');
          },
        },
      );
      return;
    }

    AnalyticsService.setCookieConsent(consent);
    setAnonymousConsent(consent);
  }

  return {
    consent: isSignedIn ? serverConsent : anonymousConsent,
    isPending,
    isReady: isLoaded,
    updateConsent,
  };
}

function toCookieConsent(consent: 'Accepted' | 'Declined' | null | undefined): CookieConsent {
  if (consent === 'Accepted') {
    return 'accepted';
  }
  if (consent === 'Declined') {
    return 'declined';
  }
  return 'undecided';
}
