import { lazyRouteComponent, Route } from '@tanstack/react-router';

import { authenticatedRoute } from '@/routes/root-route';

export const dashboardRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: '/',
  component: lazyRouteComponent(() => import('./dashboard-page'), 'DashboardPage'),
});
