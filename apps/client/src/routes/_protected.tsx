import { useEffect } from 'react';
import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router';

import { AppSidebar } from '@/app/root/app-sidebar';
import { useSignInUser } from '@/app/root/use-signin-user';
import { InitLaoder } from '@/shared/components/ui/loaders/init-laoder';
import { cn } from '@/shared/lib/helpers';
import { stringIsNotEmptyOrWhitespace } from '@/shared/utils/string';

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ location, context: { authClient } }) => {
    const session = authClient.session;
    const sessionToken = await session?.getToken();
    if (!stringIsNotEmptyOrWhitespace(sessionToken)) {
      throw redirect({ to: '/auth', search: { from: location.href } });
    }

    return { session };
  },
  component: Protected,
  pendingComponent: InitLaoder,
});

function Protected() {
  const navigate = useNavigate({ from: Route.fullPath });
  const query = useSignInUser();

  const isFirstTime = query.data.data?.firstTime === true;

  useEffect(() => {
    if (query.isSuccess && query.data.data) {
      if (isFirstTime) {
        navigate({ to: '/welcome', replace: true });
      }
    }
  }, [navigate, query.data.data, query.isSuccess, query.status]);

  return (
    <main className={`bg-background text-primary`}>
      <div className='flex h-[100dvh] w-screen'>
        {isFirstTime ? null : <AppSidebar />}
        <div className={cn('h-full flex-1 py-2', isFirstTime ? 'px-2' : 'pr-2')}>
          <div className='h-full w-full overflow-auto rounded-md border bg-background-foreground/45 p-4'>
            <Outlet />
          </div>
        </div>
      </div>
    </main>
  );
}
