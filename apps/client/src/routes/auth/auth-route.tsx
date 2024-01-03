import { Route } from '@tanstack/react-router';

import { supabase } from '@/lib/supabase-client';
import { rootRoute } from '@/router';
import { AuthPage } from '@/routes/auth/auth-page';

export const authRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/auth',
  beforeLoad: async ({ location, navigate }) => {
    const session = await supabase.auth.getSession();
    // TODO set params via router
    if (!session.data.session?.access_token) {
      // const params = new URLSearchParams();
      // params.set('from', location.href);
      return null;
    }
    return navigate({ to: '/home' });
  },
  component: AuthPage,
});
