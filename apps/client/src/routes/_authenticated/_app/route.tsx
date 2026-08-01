import { browserStorage } from '@kijk/core/lib/browser-storage';
import { SidebarInset, SidebarProvider } from '@kijk/ui/components/sidebar';
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

import { AppSidebar } from '@/app/root/app-sidebar';
import { SiteHeader } from '@/app/root/site-header';
import { currentUserQueryOptions } from '@/shared/api/users/options';
import { isReadyCurrentUser } from '@/shared/api/users/types';
import { AnalyticsBanner } from '@/shared/components/analytics-banner';
import { InitLoader } from '@/shared/components/ui/loaders/init-loader';
import { AnalyticsService } from '@/shared/lib/analytics-client';
import { CORRELATION_ID_HEADER } from '@/shared/types/api';
import { stringIsNotEmptyOrWhitespace } from '@/shared/utils/string';

export const Route = createFileRoute('/_authenticated/_app')({
  beforeLoad: async ({ context: { queryClient } }) => {
    const currentUser = await queryClient.ensureQueryData(currentUserQueryOptions());
    if (!isReadyCurrentUser(currentUser)) {
      throw redirect({ replace: true, to: '/welcome' });
    }

    const correlationId = browserStorage.getItem<string>(CORRELATION_ID_HEADER);
    if (stringIsNotEmptyOrWhitespace(correlationId)) {
      AnalyticsService.identifyUser(correlationId);
    }
  },
  component: AppLayout,
  pendingComponent: InitLoader,
  pendingMinMs: 100,
  pendingMs: 50,
});

function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className='min-h-[calc(100svh-(--spacing(4)))]'>
        <SiteHeader />
        <div className='p-4'>
          <Outlet />
        </div>
      </SidebarInset>
      <AnalyticsBanner />
    </SidebarProvider>
  );
}
