import { FileRoute } from '@tanstack/react-router';

import { userSignInQuery } from '@/app/root/use-signin-user';
import { useAuthStore } from '@/shared/stores/auth-store';
import { getSessionOrRedirect } from '@/shared/utils/router.utils';

export const Route = new FileRoute('/_protected').createRoute({
  beforeLoad: async ({ location, context: { queryClient }, navigate }) => {
    const session = await getSessionOrRedirect(location.href);
    const data = await queryClient.ensureQueryData(userSignInQuery);
    useAuthStore.setState((c) => ({ ...c, user: data.data }));

    if (data.data?.firstTime == true) {
      void navigate({ to: '/welcome', replace: true });
    }

    return { session };
  },
});
