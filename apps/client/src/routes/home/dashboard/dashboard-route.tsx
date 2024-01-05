import { Route } from '@tanstack/react-router';

import { AppRouteError } from '@/components/app-route-error';
import { DashboardPage } from '@/routes/home/dashboard/dashboard-page';
import { homeLayoutRoute } from '@/routes/home/home-route';

export const dashboardRoute = new Route({
  getParentRoute: () => homeLayoutRoute,
  path: '/dashboard',
  component: DashboardPage,
  errorComponent: AppRouteError,
});
