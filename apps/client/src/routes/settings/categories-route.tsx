import { lazyRouteComponent, Route } from '@tanstack/react-router';

import { settingsRoute } from '@/routes/settings/settings-route';

export const settingsCategoriesRoute = new Route({
  getParentRoute: () => settingsRoute,
  path: '/categories',
  component: lazyRouteComponent(() => import('./categories-page'), 'CategoriesPage'),
});
