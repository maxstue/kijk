import { redirect } from 'react-router-dom';

import { supabase } from '@/lib/supabase-client';

export async function getSession(url: string) {
  const session = await supabase.auth.getSession();
  if (!session.data.session?.access_token) {
    const params = new URLSearchParams();
    params.set('from', new URL(url).pathname);
    throw redirect('/auth' + `?${params.toString()}`);
  }
  return session;
}
