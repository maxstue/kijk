import { useEffect } from 'react';
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';

import { useSignInUser } from '@/app/root/use-signin-user';
import { InitLaoder } from '@/shared/components/ui/loaders/init-laoder';
import { useAuthStore } from '@/shared/stores/auth-store';
import { getSessionOrRedirect } from '@/shared/utils/router.utils';

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ location }) => {
    const session = await getSessionOrRedirect(location.href);
    return { session };
  },
  pendingComponent: () => <InitLaoder />,
  component: () => {
    const navigate = useNavigate({ from: Route.fullPath });
    const query = useSignInUser();

    useEffect(() => {
      if (query.isSuccess && query.data.data) {
        useAuthStore.setState((c) => ({ ...c, user: query.data.data }));

        if (query.data.data?.firstTime == true) {
          void navigate({ to: '/welcome', replace: true });
        }
      }
    }, [query.status]);

    return <Outlet />;
  },
});
