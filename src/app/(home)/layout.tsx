import React, { Suspense } from 'react';

import { Toaster } from '@/components/ui/toaster';
import { SiteHeader } from '@/components/site-header';
import { AuthProvider } from '@/app/(home)/(components)/auth-provider';
import { HomeNav } from '@/app/(home)/(components)/home-nav';
import { HomeNavActions } from '@/app/(home)/(components)/home-nav-actions';

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function HomeLayout({ children }: RootLayoutProps) {
  return (
    <div className='flex min-h-screen flex-col'>
      <header className='bg-background'>
        <SiteHeader
          navChildren={
            <Suspense>
              <HomeNav />
            </Suspense>
          }
          actionChildren={
            <>
              {/* TODO */}
              {/* @ts-expect-error Server Component*/}
              <HomeNavActions />
            </>
          }
        />
      </header>
      <main className='container flex-1'>
        <Suspense>
          <AuthProvider>{children}</AuthProvider>
          <Toaster />
        </Suspense>
      </main>
    </div>
  );
}
