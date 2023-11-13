import { RouteObject } from 'react-router-dom';

import { AppRouteError } from '@/components/app-route-error';
import { DashboardPage } from '@/routes/dashboard/dashboard-page';

export const dashboardRoute = {
  index: true,
  element: <DashboardPage />,
  errorElement: <AppRouteError />,
} as RouteObject;
