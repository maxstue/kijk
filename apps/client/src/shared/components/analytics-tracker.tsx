import { usePostHog } from '@posthog/react';
import { useLocation } from '@tanstack/react-router';
import { useEffect } from 'react';

/** Sends a PostHog page view on every route change. Renders nothing. */
export const AnalyticsTracker = () => {
  const location = useLocation();
  const posthog = usePostHog();
  useEffect(() => {
    posthog.capture('$pageview');
  }, [location, posthog]);

  return undefined;
};
