import { PostHogProvider } from '@posthog/react';
import type { PropsWithChildren } from 'react';

import { AnalyticsService } from '@/shared/lib/analytics-tracking';

/** Provides the PostHog client to the app. */
export function AnalyticsProvider(props: PropsWithChildren) {
  return <PostHogProvider client={AnalyticsService.getInstance()}>{props.children}</PostHogProvider>;
}
