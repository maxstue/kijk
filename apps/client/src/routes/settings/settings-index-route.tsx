import { Navigate, Route } from '@tanstack/react-router';

import { settingsRoute } from '@/routes/settings/settings-route';

export const settingsIndexRoute = new Route({
  getParentRoute: () => settingsRoute,
  path: '/',
  component: () => <Navigate to='/settings/$section' params={{ section: 'profile' }} />,
});
