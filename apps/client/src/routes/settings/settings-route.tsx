import { Navigate, RouteObject } from 'react-router-dom';

import { AppRouteError } from '@/components/app-route-error';
import { SettingsSectionPage } from '@/routes/settings/settings-section-page';

export const settingsRoute = {
  path: 'settings',
  async lazy() {
    return { Component: (await import('./settings-page')).default };
  },
  children: [
    { index: true, element: <Navigate to='profile' /> },
    { path: ':section', element: <SettingsSectionPage /> },
  ],
  errorElement: <AppRouteError />,
} as RouteObject;
