import { useAuth } from '@clerk/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { currentUserQueryOptions, updateUserMutationOptions } from '@/shared/api/users/options';
import { AnalyticsService } from '@/shared/lib/analytics-client';
import type { CookieConsent } from '@/shared/types/analytics';

export function useAnalyticsConsent() {
  const { isLoaded, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const { data: currentAccount } = useQuery(currentUserQueryOptions());
  const currentUser = currentAccount?.user;
  const [anonymousConsent, setAnonymousConsent] = useState<CookieConsent>(() => AnalyticsService.getCookieConsent());
  const serverConsent = toCookieConsent(currentUser?.analyticsConsent);
  const { mutate, isPending } = useMutation({
    ...updateUserMutationOptions(),
    onSuccess(data) {
      AnalyticsService.setCookieConsent(toCookieConsent(data.analyticsConsent));
      queryClient.invalidateQueries({ queryKey: currentUserQueryOptions().queryKey });
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
