import { lazyRouteComponent, Route } from '@tanstack/react-router';

import { settingsRoute } from '@/routes/settings/settings-route';

export const settingsProfileRoute = new Route({
  getParentRoute: () => settingsRoute,
  path: '/',
  component: lazyRouteComponent(() => import('./profile-page'), 'ProfilePage'),
});
