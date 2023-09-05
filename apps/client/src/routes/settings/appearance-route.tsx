import { lazyRouteComponent, Route } from '@tanstack/react-router';

import { settingsRoute } from '@/routes/settings/settings-route';

export const settingsAppearanceRoute = new Route({
  getParentRoute: () => settingsRoute,
  path: '/appearance',
  component: lazyRouteComponent(() => import('./appearance-page'), 'AppearancePage'),
});
