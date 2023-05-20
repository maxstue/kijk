import React, { Suspense } from 'react';

import { siteConfig } from '@/config/site';
import { Toaster } from '@/components/ui/toaster';
import { Icons } from '@/components/icons';
import { SiteHeader } from '@/components/site-header';
import { AuthProvider } from '@/app/(home)/(components)/auth-provider';
import { HomeNavActions } from '@/app/(home)/(components)/home-nav-actions';
import { homeConfig } from '@/app/(home)/constants';

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function HomeLayout({ children }: RootLayoutProps) {
  return (
    <div className='flex min-h-screen flex-col'>
      <header className='bg-background'>
        <Suspense fallback={<NavLoading />}>
          <SiteHeader navItems={homeConfig.mainNav}>
            {/* TODO */}
            {/* @ts-expect-error Server Component*/}
            <HomeNavActions />
          </SiteHeader>
        </Suspense>
      </header>
      <main className='container flex-1'>
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </main>
    </div>
  );
}

function NavLoading() {
  return (
    <header className='supports-backdrop-blur:bg-background/60 sticky top-0 z-40 w-full border-b bg-background/95 shadow-sm backdrop-blur'>
      <div className='container flex h-14 items-center'>
        <div className='mr-4 hidden md:flex'>
          <div className='mr-6 flex items-center space-x-2'>
            <Icons.logo className='h-6 w-6' />
            <span className='hidden font-bold sm:inline-block'>{siteConfig.name}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
