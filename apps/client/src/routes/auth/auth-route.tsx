import { redirect, RouteObject } from 'react-router-dom';

import { supabase } from '@/lib/supabase-client';
import { AuthPage } from '@/routes/auth/auth-page';

export const authRoute = {
  path: 'auth',
  loader: async ({ request }) => {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.access_token) {
      const params = new URLSearchParams();
      params.set('from', new URL(request.url).pathname);
      return null;
    }
    return redirect('/home');
  },
  element: <AuthPage />,
} as RouteObject;
