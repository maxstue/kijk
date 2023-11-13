import { redirect, RouteObject } from 'react-router-dom';

import { userInitQuery } from '@/app/root/use-init-user';
import { AppRouteError } from '@/components/app-route-error';
import { queryClient } from '@/lib/query-client';
import WelcomePage from '@/routes/welcome/welcome-page';

export const welcomeRoute = {
  path: 'welcome',
  loader: async () => {
    const data = await queryClient.ensureQueryData(userInitQuery);
    if (data.data?.firstTime == false) {
      return redirect('/');
    }
    return null;
  },
  element: <WelcomePage />,
  errorElement: <AppRouteError />,
} as RouteObject;
