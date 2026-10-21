import * as usersOptions from '@kijk/api/users/options';
import { isReadyCurrentUser } from '@kijk/api/users/types';
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

import { InitLoader } from '@/shared/components/ui/loaders/init-loader';

/** Layout for onboarding; redirects to `/` once onboarding is completed. */
export const Route = createFileRoute('/_authenticated/_onboarding')({
  beforeLoad: async ({ context: { queryClient } }) => {
    const currentUser = await queryClient.query({ ...usersOptions.meQueryOptions(), staleTime: 'static' });
    if (isReadyCurrentUser(currentUser)) {
      throw redirect({ replace: true, to: '/' });
    }
  },
  component: Outlet,
  pendingComponent: InitLoader,
});
