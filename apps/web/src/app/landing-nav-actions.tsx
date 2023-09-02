import React from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/button';
import { ThemeModeToggle } from '@/components/theme-mode-toggle';

export function LandingnNavActions() {
  return (
    <div className='flex space-x-3'>
      <nav className='flex items-center space-x-1'>
        <ThemeModeToggle />
      </nav>
      {/* TODO link to login of app */}
      <Link
        href='/'
        className={cn(
          buttonVariants({ variant: 'secondary', size: 'sm' }),
          'px-4 hover:bg-muted-foreground hover:text-white'
        )}
      >
        Login
      </Link>
    </div>
  );
}
