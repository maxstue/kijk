import { createRouter } from '@tanstack/react-router';

import { routeTree } from '@/routeTree.gen';
import { AppError } from '@/shared/components/errors/app-error';
import { NotFound } from '@/shared/components/not-found';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { queryClient } from '@/shared/lib/query-client';

// Create a new router instance
export const router = createRouter({
  context: {
    authClient: undefined!,
    queryClient, // This will be set in the RouterProvider
  },
  defaultErrorComponent: AppError,
  defaultNotFoundComponent: NotFound,
  defaultPendingComponent: () => <Loader className='h-6 w-6' />,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  defaultStructuralSharing: true,
  routeTree,
  scrollRestoration: true,
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
