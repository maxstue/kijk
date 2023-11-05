import { lazyRouteComponent, Route } from '@tanstack/react-router';

import { authenticatedRoute } from '@/routes/root-route';

export const settingsRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: 'settings',
  component: lazyRouteComponent(() => import('./settings-page'), 'SettingsPage'),
});
