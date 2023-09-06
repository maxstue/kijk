import { lazyRouteComponent, Route } from '@tanstack/react-router';
import * as z from 'zod';

import { settingsRoute } from '@/routes/settings/settings-route';

// TODO make param typesafe only allow a certain string
export const settingsSectionRoute = new Route({
  getParentRoute: () => settingsRoute,
  path: '$section',
  parseParams: (params) => ({
    section: z.string().parse(params.section),
  }),
  component: lazyRouteComponent(() => import('./settings-section-page'), 'SettingsSectionPage'),
});
