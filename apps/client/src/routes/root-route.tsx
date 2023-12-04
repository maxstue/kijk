import { redirect, RouteObject } from 'react-router-dom';

import { userSignInQuery } from '@/app/root/use-signin-user';
import { AppRouteError } from '@/components/app-route-error';
import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase-client';
import { budgetRoute } from '@/routes/budget/budget-route';
import { dashboardRoute } from '@/routes/dashboard/dashboard-route';
import NoMatch from '@/routes/no-match';
import { settingsRoute } from '@/routes/settings/settings-route';
import { welcomeRoute } from '@/routes/welcome/welcome-route';
import { useAuthStore } from '@/stores/auth-store';
import { getSession } from '@/utils/router.utils';

import { RootLayout } from './root-layout';

const rootRoute = {
  id: 'rootRoute',
  path: '',
  loader: async ({ request }) => {
    // NOTE needed as a fallback for when the user refreshes the page. https://github.com/remix-run/react-router/discussions/9564
    await getSession(request.url);
    const data = await queryClient.ensureQueryData(userSignInQuery);
    if (data.data?.firstTime) {
      return redirect('/home/welcome');
    }
    useAuthStore.setState((c) => ({ ...c, user: data.data }));

    return null;
  },
  element: <RootLayout />,
  errorElement: <AppRouteError />,
  children: [dashboardRoute, budgetRoute, settingsRoute, { path: '*', element: <NoMatch /> }],
} as RouteObject;

export const privateRoute = {
  id: 'privateRoute',
  path: 'home',
  loader: async ({ request }) => {
    const session = await getSession(request.url);
    const data = await queryClient.ensureQueryData(userSignInQuery);
    useAuthStore.setState((c) => ({ ...c, user: data.data }));
    return { session };
  },
  errorElement: <AppRouteError />,
  children: [rootRoute, welcomeRoute],
} as RouteObject;
