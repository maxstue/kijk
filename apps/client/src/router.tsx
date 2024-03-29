import { Router } from '@tanstack/react-router';

import { NotFoundRoute } from '@/routes/-not-found';
import { routeTree } from '@/routeTree.gen';
import { AppRouteError } from '@/shared/components/app-route-error';
import { AsyncLoader } from '@/shared/components/async-loader';
import { queryClient } from '@/shared/lib/query-client';

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
  notFoundRoute: NotFoundRoute,
  defaultPendingComponent: () => <AsyncLoader />,
  defaultErrorComponent: AppRouteError,
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
