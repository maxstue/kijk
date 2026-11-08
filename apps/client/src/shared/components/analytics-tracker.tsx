import { useLocation } from '@tanstack/react-router';
import { useEffect } from 'react';

import { AnalyticsService } from '@/shared/lib/analytics-tracking';

/** Sends a PostHog page view on every route change. Renders nothing. */
export const AnalyticsTracker = () => {
  const pathname = useLocation({ select: (location) => location.pathname });
  useEffect(() => {
    AnalyticsService.captureEvent('$pageview');
  }, [pathname]);

  return undefined;
};
