import { Route } from '@tanstack/react-router';

import { userSignInQuery } from '@/app/root/use-signin-user';
import { AppRouteError } from '@/components/app-route-error';
import { rootRoute } from '@/router';
import { HomeLayout } from '@/routes/home-layout';
import { useAuthStore } from '@/stores/auth-store';
import { getSession } from '@/utils/router.utils';

export const homeIndexRoute = new Route({
  getParentRoute: () => homeLayoutRoute,
  path: '/',
  beforeLoad: async ({ location, navigate }) => {
    if (location.pathname === '/home') {
      await navigate({ to: 'dashboard' });
    }
  },
});

export const homeLayoutRoute = new Route({
  getParentRoute: () => homeRoute,
  id: 'homeLayout',
  component: HomeLayout,
  errorComponent: AppRouteError,
});

export const homeRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/home',
  beforeLoad: async ({ location, context: { queryClient, session: pSession }, navigate }) => {
    console.log('homeRoute', location.href, pSession);
    const session = await getSession(location.href);
    const data = await queryClient.ensureQueryData(userSignInQuery);
    useAuthStore.setState((c) => ({ ...c, user: data.data }));

    if (data.data?.firstTime == true) {
      void navigate({ to: 'welcome', replace: true });
    }
    return { session };
  },
});
