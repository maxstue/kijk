import { Route } from '@tanstack/react-router';
import * as z from 'zod';

import { AppRouteError } from '@/components/app-route-error';
import { settingsTo } from '@/lib/constants';
import { homeLayoutRoute } from '@/routes/home/home-route';
import { SettingsPage } from '@/routes/home/settings/settings-page';
import { SettingsSectionPage } from '@/routes/home/settings/settings-section-page';

export const settingsIndexRoute = new Route({
  getParentRoute: () => settingsRoute,
  path: '/',
  beforeLoad: async ({ location, navigate }) => {
    if (location.pathname === '/home/settings') {
      await navigate({ to: '$section', params: { section: 'profile' } });
    }
  },
});

// TODO reanrrange route tree functions
//  some routes are in the router file
export const settingsRoute = new Route({
  getParentRoute: () => homeLayoutRoute,
  path: '/settings',
  component: SettingsPage,
  errorComponent: AppRouteError,
});

const sectionSchema = z.enum(settingsTo);
export const settingsSectionRoute = new Route({
  getParentRoute: () => settingsRoute,
  path: '$section',
  parseParams: (params) => {
    return { section: sectionSchema.parse(params.section) };
  },
  component: SettingsSectionPage,
  errorComponent: AppRouteError,
});
