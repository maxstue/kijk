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

import { RootLayout } from './root-layout';

const rootRoute = {
  id: 'rootRoute',
  path: '',
  loader: async () => {
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
    const session = await supabase.auth.getSession();
    if (!session.data.session?.access_token) {
      const params = new URLSearchParams();
      params.set('from', new URL(request.url).pathname);
      throw redirect('/auth' + `?${params.toString()}`);
    }
    const data = await queryClient.ensureQueryData(userSignInQuery);
    useAuthStore.setState((c) => ({ ...c, user: data.data }));
    return { session };
  },
  errorElement: <AppRouteError />,
  children: [rootRoute, welcomeRoute],
} as RouteObject;
