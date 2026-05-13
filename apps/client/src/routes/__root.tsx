import type { LoadedClerk } from '@clerk/react/types';
import type { QueryClient } from '@tanstack/react-query';
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { Suspense } from 'react';

import { RootDevtools } from '@/app/root/devtools';
import { Favicon } from '@/app/root/favicon';
import { AnalyticsBanner } from '@/shared/components/analytics-banner';
import { AnalyticsTracker } from '@/shared/components/analytics-tracker';
import { InitLoader } from '@/shared/components/ui/loaders/init-loader';

interface RootRouteContext {
  queryClient: QueryClient;
  authClient: LoadedClerk | undefined;
  // TODO add posthog and sentry clients here
}

export const Route = createRootRouteWithContext<RootRouteContext>()({
  component: RootPage,
  pendingComponent: InitLoader,
});

function RootPage() {
  return (
    <>
      <Favicon />
      <div className='flex h-screen flex-1 flex-col gap-4'>
        <Suspense fallback={<InitLoader />}>
          <Outlet />
        </Suspense>
      </div>
      <Suspense>
        <AnalyticsBanner />
      </Suspense>
      <Suspense>
        <RootDevtools />
      </Suspense>
      <Suspense>
        <AnalyticsTracker />
      </Suspense>
    </>
  );
}
