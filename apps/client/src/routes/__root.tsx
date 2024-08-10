import React, { lazy, Suspense } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';

import { InitLoader } from '@/shared/components/ui/loaders/init-loader';
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
  pendingComponent: InitLoader,
});

function RootPage() {
  return (
    <>
      <Outlet />
      <DevMode />
      <Suspense>
        <TanStackRouterDevtools initialIsOpen={false} position='top-right' />
        <ReactQueryDevtools buttonPosition='bottom-right' initialIsOpen={false} />
      </Suspense>
    </>
  );
}

function DevMode() {
  return env.Mode === 'production' ? undefined : (
    <Suspense>
      <DevModeIndicator />
    </Suspense>
  );
}

const TanStackRouterDevtools =
  process.env.NODE_ENV === 'production'
    ? // eslint-disable-next-line unicorn/no-useless-undefined
      () => undefined // Render nothing in production
    : React.lazy(() =>
        // Lazy load in development
        import('@tanstack/router-devtools').then((response) => ({
          default: response.TanStackRouterDevtools,
          // For Embedded Mode
          // default: res.TanStackRouterDevtoolsPanel
        })),
      );
