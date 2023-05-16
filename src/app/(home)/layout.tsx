import React from 'react';

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
        {/* TODO */}
        {/* @ts-expect-error Server Component*/}
        <SiteHeader navChildren={<HomeNav />} actionChildren={<HomeNavActions />} />
      </header>
      <main className='container flex-1'>
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </main>
    </div>
  );
}
