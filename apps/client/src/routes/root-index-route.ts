import { Route } from '@tanstack/react-router';

import { rootRoute } from '@/routes/root-route';

export const rootIndexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: async ({ navigate }) => {
    await navigate({ to: '/home' });
  },
});
