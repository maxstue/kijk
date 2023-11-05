import { lazyRouteComponent, Route } from '@tanstack/react-router';

import { rootRoute } from '@/routes/root-route';

export const authRoute = new Route({
  getParentRoute: () => rootRoute,
  path: 'auth',
  component: lazyRouteComponent(() => import('./auth-page'), 'AuthPage'),
});
