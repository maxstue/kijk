import { redirect, RouteObject } from 'react-router-dom';

import { userInitQuery } from '@/app/root/use-init-user';
import { AppRouteError } from '@/components/app-route-error';
import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase-client';
import { budgetRoute } from '@/routes/budget/budget-route';
import { dashboardRoute } from '@/routes/dashboard/dashboard-route';
import { settingsRoute } from '@/routes/settings/settings-route';

import { RootLayout } from './root-layout';

export const authenticatedRoute = {
  id: 'authenticatedRoute',
  path: '',
  loader: async ({ request }) => {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.access_token) {
      const params = new URLSearchParams();
      params.set('from', new URL(request.url).pathname);
      throw redirect('/auth' + `?${params.toString()}`);
    }
    await queryClient.ensureQueryData(userInitQuery);
    return { session };
  },
  element: <RootLayout />,
  errorElement: <AppRouteError />,
  children: [dashboardRoute, budgetRoute, settingsRoute],
} as RouteObject;
