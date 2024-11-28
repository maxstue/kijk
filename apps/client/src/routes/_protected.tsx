import { useEffect } from 'react';
import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router';

import { AppSidebar } from '@/app/root/app-sidebar';
import { useSignInUser } from '@/app/root/use-signin-user';
import { InitLoader } from '@/shared/components/ui/loaders/init-loader';
import { Separator } from '@/shared/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/shared/components/ui/sidebar';
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
    <SidebarProvider>
      {isFirstTime ? undefined : <AppSidebar />}
      <SidebarInset>
        {isFirstTime ? undefined : (
          <header className='flex h-16 shrink-0 items-center gap-2'>
            <div className='flex items-center gap-2 px-4'>
              <SidebarTrigger className='-ml-1' />
              <Separator className='mr-2 h-4' orientation='vertical' />
              {/* TODO add breadcrumbs */}
              {/* <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className='hidden md:block'>
                  <BreadcrumbLink href='#'>Building Your Application</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className='hidden md:block' />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb> */}
            </div>
          </header>
        )}
        {/* Content */}
        <div className='flex flex-1 flex-col gap-4 p-4 pt-0'>
          {/* <main className={cn(isFirstTime ? 'p-2' : 'py-2 pl-64 pr-2', 'flex flex-1 flex-col')}> */}
          {/* <div className='grow overflow-auto rounded-md border bg-muted/50 p-6'> */}
          <Outlet />
          {/* </div> */}
          {/* </main> */}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
