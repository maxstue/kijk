import { useEffect } from 'react';
import { useLocation } from '@tanstack/react-router';
import { usePostHog } from 'posthog-js/react';

export const AnalyticsTracker = () => {
  const location = useLocation();
  const posthog = usePostHog();
  useEffect(() => {
    if (posthog) {
      posthog.capture('$pageview');
    }
  }, [location, posthog]);

  // eslint-disable-next-line unicorn/no-useless-undefined
  return undefined;
};
