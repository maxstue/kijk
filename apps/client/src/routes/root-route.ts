import { Session } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/react-query';
import { rootRouteWithContext } from '@tanstack/react-router';

import RootPage from '@/routes/root-page';
import { type Optional } from '@/types/app';

export const rootRoute = rootRouteWithContext<{ queryClient: QueryClient; session: Optional<Session> }>()({
  component: RootPage,
});
