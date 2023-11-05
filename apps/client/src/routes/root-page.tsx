import { PropsWithChildren, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, Outlet } from '@tanstack/react-router';

import { CommandMenu } from '@/app/root/command-menu';
import { UserNav } from '@/app/root/user-nav';
import { Icons } from '@/components/icons';
import { ThemeModeToggle } from '@/components/theme-mode-toggle';
import { Toaster } from '@/components/ui/toaster';
import { userApi } from '@/lib/api/user-api';
import { siteConfig } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function RootPage() {
  return (
    <Init>
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
          <Outlet />
          <Toaster />
        </main>
      </div>
    </Init>
  );
}

interface SProps {
  children?: ReactNode;
}

function SiteHeader({ children }: SProps) {
  return (
    <header className='supports-backdrop-blur:bg-background/60 sticky top-0 z-40 w-full border-b bg-background/95 shadow-sm backdrop-blur'>
      <div className='container flex h-14 items-center'>
        <div className='mr-4 hidden md:flex'>
          <Link to='/' className='mr-6 flex items-center space-x-2'>
            <Icons.logo className='h-6 w-6' />
            <span className='hidden font-bold sm:inline-block'>{siteConfig.name}</span>
          </Link>
          <nav className='hidden gap-6 md:flex'>
            <Link
              to={'/'}
              className={cn(
                'flex items-center text-lg font-medium text-foreground/60 transition-colors hover:text-foreground/80 data-[active]:text-foreground sm:text-sm',
                false && 'cursor-not-allowed opacity-80',
              )}
            >
              Dashboard
            </Link>
            <Link
              to={'/budget'}
              className={cn(
                'flex items-center text-lg font-medium text-foreground/60 transition-colors hover:text-foreground/80 data-[active]:text-foreground sm:text-sm',
                false && 'cursor-not-allowed opacity-80',
              )}
            >
              Budget
            </Link>
            <Link
              to={'/'}
              className={cn(
                'flex items-center text-lg font-medium text-foreground/60 transition-colors hover:text-foreground/80 data-[active]:text-foreground sm:text-sm',
                false && 'cursor-not-allowed opacity-80',
              )}
            >
              Report
            </Link>
          </nav>
        </div>
        <div className='flex flex-1 items-center justify-between space-x-2 sm:space-x-4 md:justify-end'>{children}</div>
      </div>
    </header>
  );
}

function Init({ children }: PropsWithChildren) {
  const { isSuccess, isFetching, isError } = useQuery(userApi.userInit);

  return (
    <>
      {isFetching && (
        <div className='flex items-center justify-center'>
          <Icons.spinner className='h-12 w-12 animate-spin' />
        </div>
      )}
      {isError && <div className='text-red-400'>Error during initialisation</div>}
      {isSuccess && children}
    </>
  );
}
