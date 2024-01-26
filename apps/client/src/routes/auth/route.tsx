import { FileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { supabase } from '@/shared/lib/supabase-client';

const authSearchSchema = z.object({
  from: z.string().optional(),
});

export const Route = new FileRoute('/auth').createRoute({
  validateSearch: authSearchSchema,
  beforeLoad: async ({ navigate, search }) => {
    const session = await supabase.auth.getSession();

    if (!session.data.session?.access_token) {
      return null;
    }

    return navigate({ to: search?.from ?? '/home' });
  },
});
