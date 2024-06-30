import React, { lazy, Suspense } from 'react';
import { Clerk } from '@clerk/clerk-js/headless';
import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';

import { InitLaoder } from '@/shared/components/ui/loaders/init-laoder';
import { env } from '@/shared/env';

const DevModeIndicator = lazy(() =>
  import('@/shared/components/dev-mode-indicator').then(({ DevModeIndicator }) => ({ default: DevModeIndicator })),
);

interface RootRouteContext {
  queryClient: QueryClient;
  authClient: Clerk;
}

export const Route = createRootRouteWithContext<RootRouteContext>()({
  beforeLoad: ({ context: { authClient } }) => authClient.load(),
  component: RootPage,
  pendingComponent: InitLaoder,
});

function RootPage() {
  return (
    <>
      <Outlet />
      <DevMode />
      <Suspense>
        <TanStackRouterDevtools initialIsOpen={false} position='top-right' />
        <ReactQueryDevtools initialIsOpen={false} buttonPosition='bottom-right' />
      </Suspense>
    </>
  );
}

function DevMode() {
  return env.Mode === 'production' ? null : (
    <Suspense>
      <DevModeIndicator />
    </Suspense>
  );
}

const TanStackRouterDevtools =
  process.env.NODE_ENV === 'production'
    ? () => null // Render nothing in production
    : React.lazy(() =>
        // Lazy load in development
        import('@tanstack/router-devtools').then((res) => ({
          default: res.TanStackRouterDevtools,
          // For Embedded Mode
          // default: res.TanStackRouterDevtoolsPanel
        })),
      );
