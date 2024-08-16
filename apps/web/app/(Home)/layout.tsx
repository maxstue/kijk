import { ReactNode } from 'react';
import Link from 'next/link';
import { siteConfig } from '@/constants/config';
import { cn } from '@/utils/cn';
import { HomeLayout } from 'fumadocs-ui/home-layout';

import { baseOptions } from '@/app/layout.config';
import { buttonVariants } from '@/components/ui/button';

export default function Layout({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <HomeLayout {...baseOptions}>
      {children}
      <Footer />
    </HomeLayout>
  );
}

function Footer(): React.ReactElement {
  return (
    <footer className='mt-auto border-t bg-card py-8 text-secondary-foreground'>
      <div className='container flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div className='flex items-center gap-4'>
          <p className='text-sm font-semibold'>Kijk</p>
          <p className='text-sm'>
            Built with ❤️ by{' '}
            <a href={siteConfig.url} rel='noreferrer noopener' target='_blank' className='font-medium'>
              maxstue
            </a>
          </p>
          <Link href='/terms' className={cn(buttonVariants({ variant: 'link', size: 'sm' }))}>
            Terms of Service
          </Link>
          <Link href='/privacy' className={cn(buttonVariants({ variant: 'link', size: 'sm' }))}>
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
