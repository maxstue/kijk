import React, { Suspense } from 'react';
import { Session } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Outlet, rootRouteWithContext } from '@tanstack/react-router';

import { AsyncLoader } from '@/components/async-loader';
import { Optional } from '@/types/app';

interface RootRouteContext {
  queryClient: QueryClient;
  session: Optional<Session>;
}

export const Route = rootRouteWithContext<RootRouteContext>()({
  component: RootPage,
});

function RootPage() {
  return (
    <Suspense fallback={<AsyncLoader />}>
      <Outlet />
      <TanStackRouterDevtools initialIsOpen={false} position='bottom-left' />
      <ReactQueryDevtools initialIsOpen={false} buttonPosition='bottom-right' />
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
