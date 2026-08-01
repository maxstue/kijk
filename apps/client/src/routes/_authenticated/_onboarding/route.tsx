import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

import { currentUserQueryOptions } from '@/shared/api/users/options';
import { isReadyCurrentUser } from '@/shared/api/users/types';
import { InitLoader } from '@/shared/components/ui/loaders/init-loader';

export const Route = createFileRoute('/_authenticated/_onboarding')({
  beforeLoad: async ({ context: { queryClient } }) => {
    const currentUser = await queryClient.ensureQueryData(currentUserQueryOptions());
    if (isReadyCurrentUser(currentUser)) {
      throw redirect({ replace: true, to: '/home' });
    }
  },
  component: Outlet,
  pendingComponent: InitLoader,
});
