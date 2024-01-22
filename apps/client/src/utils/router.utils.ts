import { redirect } from '@tanstack/react-router';

import { supabase } from '@/lib/supabase-client';

export async function getSessionOrRedirect(pathName: string) {
  const session = await supabase.auth.getSession();
  if (!session.data.session?.access_token) {
    throw redirect({ to: '/auth', search: { from: pathName } });
  }
  return session;
}
