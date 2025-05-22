import { createRouter } from '@tanstack/react-router';

import { routeTree } from '@/routeTree.gen';
import { AppError } from '@/shared/components/errors/app-error';
import { NotFound } from '@/shared/components/not-found';
import { AsyncLoader } from '@/shared/components/ui/loaders/async-loader';
import { queryClient } from '@/shared/lib/query-client';

// Create a new router instance
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
  context: {
    queryClient,
    authClient: undefined!, // This will be set in the RouterProvider
  },
  defaultNotFoundComponent: NotFound,
  defaultPendingComponent: () => <AsyncLoader className='h-6 w-6' />,
  defaultErrorComponent: AppError,
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
