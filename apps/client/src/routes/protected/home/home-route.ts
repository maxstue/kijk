import { Route } from '@tanstack/react-router';

import { AppRouteError } from '@/components/app-route-error';
import { dashboardRoute } from '@/routes/protected/home/dashboard/dashboard-route';
import HomeLayout from '@/routes/protected/home/home-layout';
import { protectedRoute } from '@/routes/protected/protected-route';

export const homeIndexRoute = new Route({
  getParentRoute: () => homeRoute,
  path: '/',
  beforeLoad: async ({ location, navigate }) => {
    if (location.pathname === '/home') {
      await navigate({ to: dashboardRoute.fullPath });
    }
  },
});

export const homeRoute = new Route({
  getParentRoute: () => protectedRoute,
  path: '/home',
  component: HomeLayout,
  errorComponent: AppRouteError,
});
