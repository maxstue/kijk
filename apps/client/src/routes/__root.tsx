import React, { lazy, Suspense } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';

import { InitLaoder } from '@/shared/components/ui/loaders/init-laoder';
import { env } from '@/shared/env';
import type { AuthClient } from '@/shared/lib/auth-client';

const DevModeIndicator = lazy(() =>
  import('@/shared/components/dev-mode-indicator').then(({ DevModeIndicator }) => ({ default: DevModeIndicator })),
);

interface RootRouteContext {
  queryClient: QueryClient;
  authClient: AuthClient;
}

export const Route = createRootRouteWithContext<RootRouteContext>()({
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
