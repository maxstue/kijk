import { usePostHog } from '@posthog/react';
import { useLocation } from '@tanstack/react-router';
import { useEffect } from 'react';

export const AnalyticsTracker = () => {
  const location = useLocation();
  const posthog = usePostHog();
  useEffect(() => {
    posthog.capture('$pageview');
  }, [location, posthog]);

  return undefined;
};
