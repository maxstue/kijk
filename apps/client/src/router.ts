import { Router } from '@tanstack/react-router';

import { queryClient } from '@/lib/query-client';
import { dashboardRoute } from '@/routes/dashboard/dashboard-route';
import { rootRoute } from '@/routes/root-route';
import { settingsAccountRoute } from '@/routes/settings/account-route';
import { settingsAppearanceRoute } from '@/routes/settings/appearance-route';
import { settingsCategoriesRoute } from '@/routes/settings/categories-route';
import { settingsNotificationsRoute } from '@/routes/settings/notifications-route';
import { settingsProfileRoute } from '@/routes/settings/profile-route';
import { settingsRoute } from '@/routes/settings/settings-route';

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  settingsRoute.addChildren([
    settingsAccountRoute,
    settingsAppearanceRoute,
    settingsCategoriesRoute,
    settingsNotificationsRoute,
    settingsProfileRoute,
  ]),
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
