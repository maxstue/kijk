import { Router } from '@tanstack/react-router';

import { queryClient } from '@/lib/query-client';
import { dashboardRoute } from '@/routes/dashboard/dashboard-route';
import { rootRoute } from '@/routes/root-route';

const routeTree = rootRoute.addChildren([dashboardRoute]);

// Set up a Router instance
export const router = new Router({
  routeTree,
  defaultPreload: 'intent',
  context: {
    queryClient: queryClient,
  },
});

// Register things for typesafety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
