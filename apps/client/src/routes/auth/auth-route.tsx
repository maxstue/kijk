import { Route } from '@tanstack/react-router';
import { z } from 'zod';

import { supabase } from '@/lib/supabase-client';
import { AuthPage } from '@/routes/auth/auth-page';
import { rootRoute } from '@/routes/root-route';

const authSearchSchema = z.object({
  from: z.string().optional(),
});

export const authRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/auth',
  validateSearch: authSearchSchema,
  beforeLoad: async ({ navigate, search }) => {
    const session = await supabase.auth.getSession();

    if (!session.data.session?.access_token) {
      return null;
    }

    return navigate({ to: search?.from ?? '/home' });
  },
  component: AuthPage,
});
