import { lazyRouteComponent, Route } from '@tanstack/react-router';
import * as z from 'zod';

import { ErrorSimple } from '@/components/error-simple';
import { settingsRoute } from '@/routes/settings/settings-route';

// TODO use this somehow
//  const availableparams = settingsNav.map((x) => x.to);
const availableparams = ['profile', 'account', 'appearance', 'notifications', 'categories'] as const;

export const settingsSectionRoute = new Route({
  getParentRoute: () => settingsRoute,
  path: '$section',
  parseParams: (params) => ({
    section: z.enum(availableparams).parse(params.section),
  }),
  // TODO show notfound error
  errorComponent: ({ error }) => <ErrorSimple error={error as Error} />,
  component: lazyRouteComponent(() => import('./settings-section-page'), 'SettingsSectionPage'),
});
