import { lazyRouteComponent, Route } from '@tanstack/react-router';

import { userSignInQuery } from '@/app/root/use-signin-user';
import { AppRouteError } from '@/components/app-route-error';
import { queryClient } from '@/lib/query-client';
import { homeRoute } from '@/routes/protected/home/home-route';
import { protectedRoute } from '@/routes/protected/protected-route';

export const welcomeRoute = new Route({
  getParentRoute: () => protectedRoute,
  path: '/welcome',
  beforeLoad: async ({ navigate }) => {
    const data = await queryClient.ensureQueryData(userSignInQuery);
    if (data.data?.firstTime == false) {
      void navigate({ to: homeRoute.fullPath });
    }
  },
  component: lazyRouteComponent(() => import('@/routes/protected/welcome/welcome-page')),
  errorComponent: AppRouteError,
});
