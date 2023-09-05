import { lazyRouteComponent, Route } from '@tanstack/react-router';

import { settingsRoute } from '@/routes/settings/settings-route';

export const settingsNotificationsRoute = new Route({
  getParentRoute: () => settingsRoute,
  path: '/notifications',
  component: lazyRouteComponent(() => import('./notifications-page'), 'NotificationsPage'),
});
