import { lazyRouteComponent, Route } from '@tanstack/react-router';
import * as z from 'zod';

import { ErrorSimple } from '@/components/error-simple';
import { settingsNav } from '@/lib/constants';
import { settingsRoute } from '@/routes/settings/settings-route';

const availableparams = settingsNav.map((x) => x.to) as string[];

export const settingsSectionRoute = new Route({
  getParentRoute: () => settingsRoute,
  path: '$section',
  parseParams: (params) => ({
    section: z
      .string()
      .refine((arg) => availableparams.includes(arg))
      .parse(params.section),
  }),
  // TODO show notfound error
  errorComponent: ({ error }) => <ErrorSimple error={error as Error} />,
  component: lazyRouteComponent(() => import('./settings-section-page'), 'SettingsSectionPage'),
});
