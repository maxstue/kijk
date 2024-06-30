import { useEffect } from 'react';
import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router';

import { AppSidebar } from '@/app/root/app-sidebar';
import { useSignInUser } from '@/app/root/use-signin-user';
import { InitLaoder } from '@/shared/components/ui/loaders/init-laoder';
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
  }, [isFirstTime, navigate, query.data.data, query.isSuccess, query.status]);

  return (
    <div className='relative isolate flex h-dvh w-full bg-background text-primary'>
      {/* Sidebar */}
      {isFirstTime ? null : (
        <div className='fixed inset-y-0 left-0 min-w-64 max-w-64'>
          <AppSidebar />
        </div>
      )}
      {/* Content */}
      <main className='flex flex-1 flex-col py-2 pl-64 pr-2'>
        <div className='grow overflow-auto rounded-md border bg-background-foreground/45 p-6'>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
