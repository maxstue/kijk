import React, { Suspense } from 'react';
import { Session } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';

import { DevModeIndicator } from '@/shared/components/dev-mode-indicator';
import { NotFound } from '@/shared/components/not-found';
import { AsyncLoader } from '@/shared/components/ui/loaders/async-loader';
import { Optional } from '@/shared/types/app';

interface RootRouteContext {
  queryClient: QueryClient;
  session: Optional<Session>;
}

export const Route = createRootRouteWithContext<RootRouteContext>()({
  component: RootPage,
  notFoundComponent: NotFound,
  pendingComponent: () => <AsyncLoader className='h-6 w-6' />,
});

function RootPage() {
  return (
    <>
      <DevModeIndicator />
      <Outlet />
      <Suspense>
        <TanStackRouterDevtools initialIsOpen={false} position='bottom-left' />
        <ReactQueryDevtools initialIsOpen={false} buttonPosition='bottom-right' />
      </Suspense>
    </>
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
