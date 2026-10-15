import { currentUserQueryOptions } from '@kijk/api/users/options';
import { isReadyCurrentUser } from '@kijk/api/users/types';
import { SidebarInset, SidebarProvider } from '@kijk/ui/components/sidebar';
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

import { AppSidebar } from '@/app/root/app-sidebar';
import { SiteHeader } from '@/app/root/site-header';
import { AnalyticsBanner } from '@/shared/components/analytics-banner';
import { InitLoader } from '@/shared/components/ui/loaders/init-loader';

/** App layout with sidebar and header for onboarded users; redirects to `/welcome` while onboarding is pending. */
export const Route = createFileRoute('/_authenticated/_app')({
  beforeLoad: async ({ context: { queryClient } }) => {
    const currentUser = await queryClient.query({ ...currentUserQueryOptions(), staleTime: 'static' });
    if (!isReadyCurrentUser(currentUser)) {
      throw redirect({ replace: true, to: '/welcome' });
    }
  },
  component: AppLayout,
  pendingComponent: InitLoader,
  pendingMinMs: 100,
  pendingMs: 50,
});

function AppLayout() {
  return (
    <SidebarProvider className='h-svh overflow-hidden'>
      <AppSidebar />
      <SidebarInset className='h-svh min-h-0 overflow-y-auto md:peer-data-[variant=inset]:h-[calc(100svh-(--spacing(4)))]'>
        <SiteHeader />
        <div className='p-4'>
          <Outlet />
        </div>
      </SidebarInset>
      <AnalyticsBanner />
    </SidebarProvider>
  );
}
