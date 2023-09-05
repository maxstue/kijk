import { lazyRouteComponent, Route } from '@tanstack/react-router';

import { rootRoute } from '@/routes/root-route';

export const dashboardRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: lazyRouteComponent(() => import('./dashboard-page'), 'DashboardPage'),
});
