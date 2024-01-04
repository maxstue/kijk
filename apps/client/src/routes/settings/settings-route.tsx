import { Route } from '@tanstack/react-router';

import { AppRouteError } from '@/components/app-route-error';
import { homeLayoutRoute } from '@/routes/home-route';
import { SettingsSectionPage } from '@/routes/settings/settings-section-page';

// export const settingsRoute = {
//   path: 'settings',
//   async lazy() {
//     return { Component: (await import('./settings-page')).default };
//   },
//   children: [
//     { index: true, element: <Navigate to='profile' /> },
//     { path: ':section', element: <SettingsSectionPage /> },
//   ],
//   errorElement: <AppRouteError />,
// } as RouteObject;

export const settingsRoute = new Route({
  getParentRoute: () => homeLayoutRoute,
  path: '/settings',
  beforeLoad: async ({ navigate, location }) => {
    if (location.pathname === '/settings') {
      await navigate({ to: '$section', params: { section: 'profile' } });
    }
  },
  component: SettingsSectionPage,
  errorComponent: AppRouteError,
});

export const settingsSectionRoute = new Route({
  getParentRoute: () => settingsRoute,
  path: '$section',
  component: SettingsSectionPage,
});
