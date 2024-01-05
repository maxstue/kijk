import { lazyRouteComponent, Route } from '@tanstack/react-router';

import { AppRouteError } from '@/components/app-route-error';
import { homeRoute } from '@/routes/protected/home/home-route';

export const settingsIndexRoute = new Route({
  getParentRoute: () => settingsRoute,
  path: '/',
  beforeLoad: async ({ location, navigate }) => {
    if (location.pathname === '/home/settings') {
      await navigate({ to: '$section', params: { section: 'profile' } });
    }
  },
});

export const settingsRoute = new Route({
  getParentRoute: () => homeRoute,
  path: '/settings',
  component: lazyRouteComponent(() => import('@/routes/protected/home/settings/settings-page')),
  errorComponent: AppRouteError,
});
