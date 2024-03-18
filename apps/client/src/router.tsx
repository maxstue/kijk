import { createRouter } from '@tanstack/react-router';

import { routeTree } from '@/routeTree.gen';
import { AppError } from '@/shared/components/errors/app-error';
import { NotFound } from '@/shared/components/not-found';
import { AsyncLoader } from '@/shared/components/ui/loaders/async-loader';
import { queryClient } from '@/shared/lib/query-client';

// const sentryCreateBrowserRouter = Sentry.wrapCreateBrowserRouter(createBrowserRouter);

// Create a new router instance
export const router = createRouter({
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
  globalNotFound: NotFound,
  defaultPendingComponent: () => <AsyncLoader className='h-6 w-6' />,
  defaultErrorComponent: AppError,
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
