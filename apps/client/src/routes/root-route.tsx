import { Route } from '@tanstack/react-router';

import { userSignInQuery } from '@/app/root/use-signin-user';
import { AppRouteError } from '@/components/app-route-error';
import { rootRoute } from '@/router';
import { RootLayout } from '@/routes/root-layout';
import { useAuthStore } from '@/stores/auth-store';
import { getSession } from '@/utils/router.utils';

export const rootIndexRoute = new Route({
  getParentRoute: () => privateRoute,
  path: '/',
  beforeLoad: async ({ location, navigate }) => {
    if (location.pathname === '/home') {
      await navigate({ to: 'dashboard' });
    }
  },
  component: RootLayout,
  errorComponent: AppRouteError,
});

export const privateRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/home',
  beforeLoad: async ({ location, context: { queryClient } }) => {
    const session = await getSession(location.href);
    const data = await queryClient.ensureQueryData(userSignInQuery);
    useAuthStore.setState((c) => ({ ...c, user: data.data }));
    return { session };
  },

  errorComponent: AppRouteError,
});
