import { Route } from '@tanstack/react-router';

import { AppRouteError } from '@/components/app-route-error';
import { DashboardPage } from '@/routes/dashboard/dashboard-page';
import { rootIndexRoute } from '@/routes/root-route';

export const dashboardRoute = new Route({
  getParentRoute: () => rootIndexRoute,
  path: '/dashboard',
  component: DashboardPage,
  errorComponent: AppRouteError,
});
