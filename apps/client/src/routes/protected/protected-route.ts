import { Route } from '@tanstack/react-router';

import { userSignInQuery } from '@/app/root/use-signin-user';
import { welcomeRoute } from '@/routes/protected/welcome/welcome-route';
import { rootRoute } from '@/routes/root-route';
import { useAuthStore } from '@/stores/auth-store';
import { getSessionOrRedirect } from '@/utils/router.utils';

export const protectedRoute = new Route({
  getParentRoute: () => rootRoute,
  id: 'protected',
  beforeLoad: async ({ location, context: { queryClient }, navigate }) => {
    const session = await getSessionOrRedirect(location.href);
    const data = await queryClient.ensureQueryData(userSignInQuery);
    useAuthStore.setState((c) => ({ ...c, user: data.data }));

    if (data.data?.firstTime == true) {
      void navigate({ to: welcomeRoute.fullPath, replace: true });
    }
    return { session };
  },
});
