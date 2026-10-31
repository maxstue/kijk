import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

import { InitLoader } from '@/shared/components/ui/loaders/init-loader';

/** Layout route for signed-in users; redirects to `/auth` (remembering the target) when signed out. */
export const Route = createFileRoute('/_authenticated')({
  ssr: false,
  beforeLoad: async ({ location, context: { auth } }) => {
    const session = await auth.getSession();
    if (!session) {
      throw redirect({ search: { from: location.href }, to: '/auth' });
    }

    return { session };
  },
  component: Outlet,
  pendingComponent: InitLoader,
  pendingMinMs: 100,
  pendingMs: 50,
});
