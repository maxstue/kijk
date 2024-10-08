import { useEffect } from 'react';
import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router';

import { AppSidebar } from '@/app/root/app-sidebar';
import { useSignInUser } from '@/app/root/use-signin-user';
import { InitLoader } from '@/shared/components/ui/loaders/init-loader';
import { cn } from '@/shared/lib/helpers';
import { stringIsNotEmptyOrWhitespace } from '@/shared/utils/string';

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ location, context: { authClient } }) => {
    const session = authClient.getInstance()?.session;
    const sessionToken = await session?.getToken();
    if (!stringIsNotEmptyOrWhitespace(sessionToken)) {
      throw redirect({ to: '/auth', search: { from: location.href } });
    }

    return { session };
  },
  component: Protected,
  pendingComponent: InitLoader,
});

function Protected() {
  const navigate = useNavigate({ from: Route.fullPath });
  const query = useSignInUser();

  const isFirstTime = query.data.data?.firstTime === true;

  useEffect(() => {
    if (query.isSuccess && query.data.data && isFirstTime) {
      navigate({ to: '/welcome', replace: true });
    }
  }, [isFirstTime, navigate, query.data.data, query.isSuccess, query.status]);

  return (
    <div className='relative isolate flex h-dvh w-full bg-background text-primary'>
      {/* Sidebar */}
      {isFirstTime ? undefined : (
        <div className='fixed inset-y-0 left-0 min-w-64 max-w-64'>
          <AppSidebar />
        </div>
      )}
      {/* Content */}
      <main className={cn(isFirstTime ? 'p-2' : 'py-2 pl-64 pr-2', 'flex flex-1 flex-col')}>
        <div className='grow overflow-auto rounded-md border bg-background-foreground/45 p-6'>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
