import { redirect, Route } from '@tanstack/react-router';

import { userSignInQuery } from '@/app/root/use-signin-user';
import { AppRouteError } from '@/components/app-route-error';
import { queryClient } from '@/lib/query-client';
import { privateRoute } from '@/routes/root-route';
import WelcomePage from '@/routes/welcome/welcome-page';

export const welcomeRoute = new Route({
  getParentRoute: () => privateRoute,
  path: '/welcome',
  beforeLoad: async () => {
    const data = await queryClient.ensureQueryData(userSignInQuery);
    if (data.data?.firstTime == false) {
      throw redirect({ to: '/home' });
    }
    return null;
  },
  component: WelcomePage,
  errorComponent: AppRouteError,
});
