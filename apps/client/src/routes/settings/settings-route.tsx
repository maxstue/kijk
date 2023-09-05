import { lazyRouteComponent, Route } from '@tanstack/react-router';

import { rootRoute } from '@/routes/root-route';

export const settingsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: 'settings',
  component: lazyRouteComponent(() => import('./settings-page'), 'SettingsPage'),
});
