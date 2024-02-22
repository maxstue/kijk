import { PropsWithChildren, Suspense } from 'react';
import { createFileRoute, Link, Outlet } from '@tanstack/react-router';

import { CommandMenu } from '@/app/root/command-menu';
import { Footer } from '@/app/root/footer';
import { UserNav } from '@/app/root/user-nav';
import { AppRouteError } from '@/shared/components/app-route-error';
import { Icons } from '@/shared/components/icons';
import { ThemeModeToggle } from '@/shared/components/theme-mode-toggle';
import { AsyncLoader } from '@/shared/components/ui/loaders/async-loader';
import { siteConfig } from '@/shared/lib/constants';
import { cn } from '@/shared/lib/utils';

export const Route = createFileRoute('/_protected/home')({
  component: HomeLayout,
  errorComponent: AppRouteError,
  pendingComponent: () => <AsyncLoader className='h-6 w-6' />,
});

function HomeLayout() {
  return (
    <Suspense fallback={<AsyncLoader />}>
      <div className='flex min-h-screen flex-col bg-background'>
        <header>
          <SiteHeader>
            <div className='flex space-x-2'>
              <div className='w-full flex-1 md:w-auto md:flex-none'>
                <CommandMenu />
              </div>
              <nav className='flex items-center space-x-1'>
                <ThemeModeToggle />
              </nav>
              <div className='ml-auto flex items-center space-x-4'>
                <UserNav />
              </div>
            </div>
          </SiteHeader>
        </header>
        <main className='container flex-1'>
          <Suspense fallback={<AsyncLoader className='h-6 w-6' />}>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
      </div>
    </Suspense>
  );
}

function SiteHeader({ children }: PropsWithChildren) {
  return (
    <header className='supports-backdrop-blur:bg-background/60 sticky top-0 z-40 w-full border-b bg-background/95 shadow-sm backdrop-blur'>
      <div className='container flex h-14 items-center'>
        <div className='mr-4 hidden md:flex'>
          <Link to={'/home'} className='mr-6 flex items-center space-x-2'>
            <Icons.logo className='h-6 w-6 text-primary' />
            <span className='hidden font-bold sm:inline-block'>{siteConfig.name}</span>
          </Link>
          <nav className='hidden gap-6 md:flex'>
            <Link
              to={'/home'}
              className={cn(
                'flex items-center text-lg font-medium text-foreground/60 transition-colors hover:text-foreground/80 data-[active]:text-foreground sm:text-sm',
                false && 'cursor-not-allowed opacity-80',
              )}
            >
              Home
            </Link>
            <Link
              to={'/home/budget'}
              className={cn(
                'flex items-center text-lg font-medium text-foreground/60 transition-colors hover:text-foreground/80 data-[active]:text-foreground sm:text-sm',
                false && 'cursor-not-allowed opacity-80',
              )}
            >
              Budget
            </Link>
          </nav>
        </div>
        <div className='flex flex-1 items-center justify-between space-x-2 sm:space-x-4 md:justify-end'>{children}</div>
      </div>
    </header>
  );
}
