import { useEffect } from 'react';
import { useLocation } from '@tanstack/react-router';
import { usePostHog } from 'posthog-js/react';

export const AnalyticsTracker = () => {
  const location = useLocation();
  const posthog = usePostHog();
  useEffect(() => {
    posthog.capture('$pageview');
  }, [location, posthog]);

  return undefined;
};
