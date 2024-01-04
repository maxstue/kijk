import { Route } from '@tanstack/react-router';

import { userSignInQuery } from '@/app/root/use-signin-user';
import { AppRouteError } from '@/components/app-route-error';
import { queryClient } from '@/lib/query-client';
import { homeRoute } from '@/routes/home-route';
import WelcomePage from '@/routes/welcome/welcome-page';

export const welcomeRoute = new Route({
  getParentRoute: () => homeRoute,
  path: '/welcome',
  beforeLoad: async ({ navigate }) => {
    const data = await queryClient.ensureQueryData(userSignInQuery);
    if (data.data?.firstTime == false) {
      void navigate({ to: '/home' });
    }
    return null;
  },
  component: WelcomePage,
  errorComponent: AppRouteError,
});
