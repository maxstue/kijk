import { lazyRouteComponent, Route } from '@tanstack/react-router';

import { AppRouteError } from '@/components/app-route-error';
import { homeRoute } from '@/routes/protected/home/home-route';

export const dashboardRoute = new Route({
  getParentRoute: () => homeRoute,
  path: '/dashboard',
  component: lazyRouteComponent(() => import('@/routes/protected/home/dashboard/dashboard-page')),
  errorComponent: AppRouteError,
});
