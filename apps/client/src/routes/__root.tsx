import React from 'react';
import { Session } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Outlet, rootRouteWithContext } from '@tanstack/react-router';

import { Optional } from '@/types/app';

// TODO: add notfound route

export const Route = rootRouteWithContext<{ queryClient: QueryClient; session: Optional<Session> }>()({
  component: RootPage,
});

function RootPage() {
  console.log('root');

  return (
    <>
      <Outlet />
      <TanStackRouterDevtools initialIsOpen={false} position='bottom-left' />
      <ReactQueryDevtools initialIsOpen={false} buttonPosition='bottom-right' />
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
