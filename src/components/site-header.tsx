import { ReactNode } from 'react';
import Link from 'next/link';

import { siteConfig } from '@/config/site';
import { Icons } from '@/components/icons';

interface Props {
  actionChildren?: ReactNode;
  navChildren?: ReactNode;
}

export function SiteHeader({ actionChildren, navChildren }: Props) {
  return (
    <header className='supports-backdrop-blur:bg-background/60 sticky top-0 z-40 w-full border-b bg-background/95 shadow-sm backdrop-blur'>
      <div className='container flex h-14 items-center'>
        <div className='mr-4 hidden md:flex'>
          <Link href='/' className='mr-6 flex items-center space-x-2'>
            <Icons.logo className='h-6 w-6' />
            <span className='hidden font-bold sm:inline-block'>{siteConfig.name}</span>
          </Link>
          <nav className='flex items-center space-x-6 text-sm font-medium'>{navChildren}</nav>
        </div>
        <div className='flex flex-1 items-center justify-between space-x-2 sm:space-x-4 md:justify-end'>
          {actionChildren}
        </div>
      </div>
    </header>
  );
}
