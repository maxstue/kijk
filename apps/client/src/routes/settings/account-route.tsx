import { lazyRouteComponent, Route } from '@tanstack/react-router';

import { settingsRoute } from '@/routes/settings/settings-route';

export const settingsAccountRoute = new Route({
  getParentRoute: () => settingsRoute,
  path: '/account',
  component: lazyRouteComponent(() => import('./account-page'), 'AccountPage'),
});
