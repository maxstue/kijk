import { Session } from '@supabase/supabase-js';
import { redirect, Route, RouterContext } from '@tanstack/react-router';

import { ErrorSimple } from '@/components/error-simple';
import { userApi } from '@/lib/api/user-api';
import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase-client';
import { router } from '@/router';

import { RootPage } from './root-page';

const routerContext = new RouterContext<{ queryClient: typeof queryClient; session?: Session }>();

export const rootRoute = routerContext.createRootRoute({
  errorComponent: (error: unknown) => <ErrorSimple error={error as Error} />,
});

export const authenticatedRoute = new Route({
  getParentRoute: () => rootRoute,
  id: 'authenticatedRoute',
  path: '',
  beforeLoad: async () => {
    const session = await supabase.auth.getSession();

    if (!session.data.session?.access_token) {
      throw redirect({
        to: '/auth',
        search: {
          // Use the current location to power a redirect after login
          redirect: router.state.location.href,
        },
      });
    }
    return { session };
  },
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(userApi.userInit);
  },
  component: RootPage,
});
