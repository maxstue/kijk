import React from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Outlet } from '@tanstack/react-router';

export default function RootPage() {
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
