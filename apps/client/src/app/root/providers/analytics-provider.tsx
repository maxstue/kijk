import { PostHogProvider } from '@posthog/react';
import type { PropsWithChildren } from 'react';

import { AnalyticsService } from '@/shared/lib/analytics-tracking';

export function AnalyticsProvider(props: PropsWithChildren) {
  return <PostHogProvider client={AnalyticsService.getInstance()}>{props.children}</PostHogProvider>;
}
