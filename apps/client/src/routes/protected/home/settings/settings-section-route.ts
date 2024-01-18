import { Route } from '@tanstack/react-router';
import { z } from 'zod';

import { AppRouteError } from '@/components/app-route-error';
import { settingsTo } from '@/lib/constants';
import { settingsRoute } from '@/routes/protected/home/settings/settings-route';
import SettingsSectionPage from '@/routes/protected/home/settings/settings-section-page';

const sectionSchema = z.enum(settingsTo);

export const settingsSectionRoute = new Route({
  getParentRoute: () => settingsRoute,
  path: '$section',
  parseParams: (params) => {
    return { section: sectionSchema.parse(params.section) };
  },
  component: SettingsSectionPage,
  errorComponent: AppRouteError, // REFACTOR better error styling
});
