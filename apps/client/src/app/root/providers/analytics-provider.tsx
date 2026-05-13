import { PostHogProvider } from '@posthog/react';

import { AnalyticsService } from '@/shared/lib/analytics-client';

interface Props extends React.PropsWithChildren<{}> {}

export function AnalyticsProvider(props: Props) {
  return <PostHogProvider client={AnalyticsService.getInstance()}>{props.children}</PostHogProvider>;
}
