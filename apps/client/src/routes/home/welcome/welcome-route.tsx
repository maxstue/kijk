import { lazyRouteComponent, Route } from '@tanstack/react-router';

import { userSignInQuery } from '@/app/root/use-signin-user';
import { AppRouteError } from '@/components/app-route-error';
import { queryClient } from '@/lib/query-client';
import { homeRoute } from '@/routes/home/home-route';

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
  component: lazyRouteComponent(() => import('@/routes/home/welcome/welcome-page')),
  errorComponent: AppRouteError,
});
