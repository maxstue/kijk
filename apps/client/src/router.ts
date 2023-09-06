import { Router } from '@tanstack/react-router';

import { queryClient } from '@/lib/query-client';
import { dashboardRoute } from '@/routes/dashboard/dashboard-route';
import { rootRoute } from '@/routes/root-route';
import { settingsIndexRoute } from '@/routes/settings/settings-index-route';
import { settingsRoute } from '@/routes/settings/settings-route';
import { settingsSectionRoute } from '@/routes/settings/settings-section-route';

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  settingsRoute.addChildren([settingsIndexRoute, settingsSectionRoute]),
]);

// Set up a Router instance
export const router = new Router({
  routeTree,
  defaultPreload: 'intent',
  context: {
    queryClient: queryClient,
  },
});

// Register things for typesafety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
