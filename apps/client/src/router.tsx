// Import the generated route tree
import { Router } from '@tanstack/react-router';

import { AppRouteError } from '@/components/app-route-error';
import { AsyncLoader } from '@/components/async-loader';
import { queryClient } from '@/lib/query-client';

// import { Route as notFoundRoute } from './routes/__404';
import { routeTree } from './routeTree.gen';

// const sentryCreateBrowserRouter = Sentry.wrapCreateBrowserRouter(createBrowserRouter);

// Create a new router instance
export const router = new Router({
  routeTree,
  defaultPreload: 'intent',
  // Since we're using React Query, we don't want loader calls to ever be stale
  // This will ensure that the loader is always called when the route is preloaded or visited
  defaultPreloadStaleTime: 0,
  defaultPreloadDelay: 500,
  context: {
    queryClient,
    session: undefined,
  },
  // notFoundRoute: notFoundRoute,
  defaultPendingComponent: () => <AsyncLoader />,
  defaultErrorComponent: AppRouteError,
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
