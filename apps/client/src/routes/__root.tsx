import { Suspense, lazy } from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import type { LoadedClerk } from '@clerk/types';
import type { QueryClient } from '@tanstack/react-query';

import { Favicon } from '@/app/root/favicon';
import { AnalyticsBanner } from '@/shared/components/analytics-banner';
import { AnalyticsTracker } from '@/shared/components/analytics-tracker';
import { InitLoader } from '@/shared/components/ui/loaders/init-loader';
import { env } from '@/shared/env';

interface RootRouteContext {
  queryClient: QueryClient;
  authClient: LoadedClerk | undefined;
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
        <DevModeIndicator />
      </Suspense>
      <Suspense>
        <AnalyticsTracker />
      </Suspense>
      <Suspense>
        <TanStackRouterDevtools position='top-right' />
        <ReactQueryDevtools buttonPosition='bottom-right' />
      </Suspense>
    </>
  );
}

function DevModeIndicator() {
  return env.Mode === 'production' ? undefined : <LazyDevModeIndicator />;
}

const LazyDevModeIndicator = lazy(() =>
  import('@/shared/components/dev-mode-indicator').then(({ DevModeIndicator: Component }) => ({ default: Component })),
);
