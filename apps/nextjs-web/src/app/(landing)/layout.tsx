import { Suspense } from 'react';
import Link from 'next/link';

import { LandingnNavActions } from '@/app/(landing)/_components/landing-nav-actions';
import { siteConfig } from '@/config/site';
import { Icons } from '@/components/icons';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

interface Props {
  children: React.ReactNode;
}

export default function LandingLayout({ children }: Props) {
  return (
    <div className='flex min-h-screen flex-col'>
      <header className='bg-background'>
        <Suspense fallback={<NavLoading />}>
          <SiteHeader>
            <LandingnNavActions />
          </SiteHeader>
        </Suspense>
      </header>
      <main className='container flex-1'>{children}</main>
      <SiteFooter />
    </div>
  );
}

function NavLoading() {
  return (
    <header className='supports-backdrop-blur:bg-background/60 sticky top-0 z-40 w-full border-b bg-background/95 shadow-sm backdrop-blur'>
      <div className='container flex h-14 items-center'>
        <div className='mr-4 hidden md:flex'>
          <Link href='/' className='mr-6 flex items-center space-x-2'>
            <Icons.logo className='h-6 w-6' />
            <span className='hidden font-bold sm:inline-block'>{siteConfig.name}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
