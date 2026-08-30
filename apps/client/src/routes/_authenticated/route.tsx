import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

import { InitLoader } from '@/shared/components/ui/loaders/init-loader';
import { stringIsNotEmptyOrWhitespace } from '@/shared/utils/string';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location, context: { authClient } }) => {
    const session = authClient?.session;
    const sessionToken = await session?.getToken();
    if (!stringIsNotEmptyOrWhitespace(sessionToken)) {
      throw redirect({ search: { from: location.href }, to: '/auth' });
    }

    return { session };
  },
  component: Outlet,
  pendingComponent: InitLoader,
  pendingMinMs: 100,
  pendingMs: 50,
});
