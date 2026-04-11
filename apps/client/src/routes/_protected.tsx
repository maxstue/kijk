import { browserStorage } from '@kijk/core/lib/browser-storage';
import { SidebarInset, SidebarProvider } from '@kijk/ui/components/sidebar';
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

import { AppSidebar } from '@/app/root/app-sidebar';
import { SiteHeader } from '@/app/root/site-header';
import { useSignInUser, userSignInQuery } from '@/app/root/use-signin-user';
import { InitLoader } from '@/shared/components/ui/loaders/init-loader';
import { AnalyticsService } from '@/shared/lib/analytics-client';
import { CORRELATION_ID_HEADER } from '@/shared/types/app';
import { stringIsNotEmptyOrWhitespace } from '@/shared/utils/string';

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ location, context: { authClient, queryClient } }) => {
    const session = authClient?.session;
    const sessionToken = await session?.getToken();
    if (!stringIsNotEmptyOrWhitespace(sessionToken)) {
      throw redirect({ search: { from: location.href }, to: '/auth' });
    }

    const user = await queryClient.ensureQueryData(userSignInQuery);
    if (user.firstTime) {
      throw redirect({ replace: true, to: '/welcome' });
    }
    const correlationId = browserStorage.getItem<string>(CORRELATION_ID_HEADER);
    if (correlationId) {
      AnalyticsService.identifyUser();
    }

    return { session };
  },
  component: Protected,
  pendingComponent: InitLoader,
  pendingMinMs: 100,
  pendingMs: 50,
});

function Protected() {
  const query = useSignInUser();

  const isFirstTime = query.data.firstTime === true;

  return (
    <SidebarProvider>
      {isFirstTime ? undefined : <AppSidebar />}
      <SidebarInset className='min-h-[calc(100svh-(--spacing(4)))]'>
        {isFirstTime ? undefined : <SiteHeader />}
        <div className='p-4'>
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
